import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import ConsultationSchedule, { type IConsultationSchedule } from '@/lib/models/consultationSchedule.model';
import { ConflictError, ValidationError } from '@/lib/utils/error.util';
import { buildSlots, eachDateInRange, weekdayOf } from '@/lib/utils/consultation-time.util';
import {
  assertSpanWithinLimit,
  assertValidDate,
  assertWeekdays,
  chunk,
  isDuplicateKeyError,
  isFree,
  mergeSlots,
  slotsFingerprint,
  sortByTime,
  toRanges,
  MAX_WRITE_ATTEMPTS,
  MONTH_PATTERN,
  type MinuteRange,
  type OverlapPolicy,
} from '@/lib/services/consultation-schedule.helpers';
import type { GenerateRangeParams, GenerateRangeResult, PublicSlot, SlotTime } from '@/types/consultation.types';

/** Separate dates are separate documents, so a few can be written at once without racing each other. */
const DATE_CONCURRENCY = 20;

interface DayWriteResult {
  doc: IConsultationSchedule;
  added: number;
  bookingsPreserved: number;
}

/**
 * Version-guarded read-modify-write of ONE date. The merge is computed in JS but committed as a
 * SINGLE conditional update fenced on the document's `__v`, so a slot array derived from a stale
 * read can never be written: if anyone touched the day in between — a booking, another admin —
 * `__v` moved on, the update matches nothing, and we start over from a fresh read.
 *
 * One write means the day is never momentarily empty (no availability blackout) and can never end
 * up holding two copies of a slot. It is also why claimSlot/releaseSlot bump `__v`: a booking that
 * did not move the version would be invisible to a generate already in flight, and get overwritten.
 */
async function writeDay(
  date: string,
  incoming: SlotTime[],
  incomingRanges: MinuteRange[],
  onOverlap: OverlapPolicy,
): Promise<DayWriteResult> {
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    const current = await ConsultationSchedule.findOne({ date });
    const merged = mergeSlots(current?.slots ?? [], incoming, incomingRanges, onOverlap);

    if (!current) {
      try {
        const created = await ConsultationSchedule.create({ date, slots: merged.slots });
        return { doc: created, added: merged.added, bookingsPreserved: merged.bookingsPreserved };
      } catch (error) {
        // Someone created the day a moment before us. Re-read and merge onto theirs instead.
        if (!isDuplicateKeyError(error)) throw error;
        continue;
      }
    }

    // Nothing to change (the usual case for a re-run, or for a generate racing an identical one).
    // Skipping the write keeps `__v` still, so concurrent no-op generates never contend at all.
    if (slotsFingerprint(current.slots) === slotsFingerprint(merged.slots)) {
      return { doc: current, added: merged.added, bookingsPreserved: merged.bookingsPreserved };
    }

    const result = await ConsultationSchedule.updateOne(
      { _id: current._id, __v: current.__v },
      { $set: { slots: merged.slots }, $inc: { __v: 1 } },
    );
    if (result.matchedCount === 1) {
      current.slots = merged.slots;
      current.__v += 1;
      return { doc: current, added: merged.added, bookingsPreserved: merged.bookingsPreserved };
    }
  }
  throw new ConflictError('The schedule was being changed by someone else. Please try again.');
}

/**
 * Bulk-generates slots across a date range. Each date is merged and written under its own version
 * guard, so a booking that commits mid-flight survives and the day is never left without slots.
 */
export async function generateRange(params: GenerateRangeParams): Promise<GenerateRangeResult> {
  await connectDB();
  const { fromDate, toDate, startTime, endTime, slotMinutes, weekdays } = params;

  assertWeekdays(weekdays);
  assertSpanWithinLimit(fromDate, toDate);

  let template: SlotTime[];
  try {
    template = buildSlots(startTime, endTime, slotMinutes);
  } catch (error) {
    throw new ValidationError(error instanceof Error ? error.message : 'Invalid range.');
  }
  if (template.length === 0) {
    throw new ValidationError('That window is shorter than one slot. Widen it or shorten the slot length.');
  }
  const templateRanges = toRanges(template);

  const targetDates = eachDateInRange(fromDate, toDate).filter((date) => weekdays.includes(weekdayOf(date)));
  if (targetDates.length === 0) {
    return { datesGenerated: 0, slotsCreated: 0, bookingsPreserved: 0 };
  }

  let slotsCreated = 0;
  let bookingsPreserved = 0;
  for (const batch of chunk(targetDates, DATE_CONCURRENCY)) {
    const written = await Promise.all(batch.map((date) => writeDay(date, template, templateRanges, 'skip')));
    for (const day of written) {
      slotsCreated += day.added;
      bookingsPreserved += day.bookingsPreserved;
    }
  }

  return { datesGenerated: targetDates.length, slotsCreated, bookingsPreserved };
}

export async function getRange(fromDate: string, toDate: string): Promise<IConsultationSchedule[]> {
  await connectDB();
  const schedules = await ConsultationSchedule.find({ date: { $gte: fromDate, $lte: toDate } }).sort({ date: 1 });
  for (const schedule of schedules) {
    schedule.slots = sortByTime(schedule.slots);
  }
  return schedules;
}

/** What the public booking form renders for one date. Never leaks leadId. */
export async function getPublicSlots(date: string): Promise<PublicSlot[]> {
  await connectDB();
  const schedule = await ConsultationSchedule.findOne({ date });
  if (!schedule) return [];
  return sortByTime(schedule.slots).map((slot) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: isFree(slot),
  }));
}

/**
 * date -> count of free slots, for the calendar's "N slots left" badges. `month` is YYYY-MM.
 * Uses an indexed range query, never a regex built from caller input.
 */
export async function getMonthAvailability(month: string): Promise<Record<string, number>> {
  await connectDB();
  if (!MONTH_PATTERN.test(month)) {
    throw new ValidationError('Month must be a real month in YYYY-MM format.');
  }
  const schedules = await ConsultationSchedule.find({ date: { $gte: `${month}-01`, $lte: `${month}-31` } });
  const availability: Record<string, number> = {};
  for (const schedule of schedules) {
    availability[schedule.date] = schedule.slots.filter(isFree).length;
  }
  return availability;
}

/**
 * Replaces one day's slots (admin hand-edit) under the same version guard as generateRange.
 * Refuses to drop a booked slot, and refuses to add a slot that overlaps a booked or closed one
 * rather than quietly discarding it — the admin gets back exactly what they asked for, or an error.
 */
export async function replaceDay(date: string, slots: SlotTime[]): Promise<IConsultationSchedule> {
  await connectDB();
  assertValidDate(date);
  if (!Array.isArray(slots)) {
    throw new ValidationError('Slots must be a list.');
  }
  const incomingRanges = toRanges(slots);

  // Best-effort, friendlier error for the common case. A booking that lands after this read is
  // still safe: writeDay's merge preserves it, and rejects any submitted slot that overlaps it.
  const existing = await ConsultationSchedule.findOne({ date });
  const incomingTimes = new Set(slots.map((slot) => slot.startTime));
  const dropped = (existing?.slots ?? []).filter((slot) => slot.leadId !== null && !incomingTimes.has(slot.startTime));
  if (dropped.length > 0) {
    throw new ValidationError(
      `Cannot remove ${dropped.length} slot(s) that already have a booking. Cancel the booking first.`,
    );
  }

  const { doc } = await writeDay(date, slots, incomingRanges, 'reject');
  return doc;
}

/**
 * Atomically claims a slot. Returns false if it was already taken or does not exist.
 *
 * This is a SINGLE conditional update on purpose. A check-then-write would leave a gap in which
 * two concurrent bookers could both pass the check. Mongo guarantees only one of them matches this
 * filter. The `__v` bump publishes the booking to any schedule rewrite that is mid-flight, whose
 * version-guarded write will then miss and re-read rather than overwrite this booking away.
 */
export async function claimSlot(date: string, startTime: string, leadId: mongoose.Types.ObjectId): Promise<boolean> {
  await connectDB();
  const result = await ConsultationSchedule.updateOne(
    { date, slots: { $elemMatch: { startTime, isAvailable: true, leadId: null } } },
    { $set: { 'slots.$.leadId': leadId }, $inc: { __v: 1 } },
  );
  return result.modifiedCount === 1;
}

/**
 * Returns a slot to the pool. Used when a booking is cancelled, or to roll back a
 * failed booking.
 *
 * The `leadId` guard is load-bearing: without it, releasing frees whoever currently
 * holds the slot, not the lead we mean to release. A stale release (cancel a lead
 * twice, once after somebody else has taken the freed slot) would evict the new
 * holder while their booking and meeting link stayed live. Releasing a slot that
 * someone else now holds is a no-op, by design.
 */
export async function releaseSlot(date: string, startTime: string, leadId: mongoose.Types.ObjectId): Promise<void> {
  await connectDB();
  await ConsultationSchedule.updateOne(
    { date, slots: { $elemMatch: { startTime, leadId } } },
    { $set: { 'slots.$.leadId': null }, $inc: { __v: 1 } },
  );
}

/** Latest date that has any slots at all — drives the admin runway banner. */
export async function getGeneratedThrough(): Promise<string | null> {
  await connectDB();
  const latest = await ConsultationSchedule.findOne({ 'slots.0': { $exists: true } }).sort({ date: -1 });
  return latest?.date ?? null;
}
