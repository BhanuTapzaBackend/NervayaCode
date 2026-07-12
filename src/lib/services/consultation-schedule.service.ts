import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import ConsultationSchedule, { type IConsultationSchedule } from '@/lib/models/consultationSchedule.model';
import { ValidationError } from '@/lib/utils/error.util';
import { buildSlots, eachDateInRange, weekdayOf } from '@/lib/utils/consultation-time.util';
import {
  assertSpanWithinLimit,
  freshSlot,
  isFree,
  overlapsAny,
  rangesOf,
  slotKey,
  sortByTime,
  toRanges,
  type BulkOps,
  DATE_PATTERN,
  MONTH_PATTERN,
  REMOVABLE_SLOT,
} from '@/lib/services/consultation-schedule.helpers';
import type { GenerateRangeParams, GenerateRangeResult, PublicSlot, SlotTime } from '@/types/consultation.types';

/**
 * Bulk-generates slots across a date range.
 *
 * Never rewrites a day wholesale. It pulls ONLY free+open slots, re-reads what survived
 * (bookings and admin-closed slots), then pushes the template slots that do not overlap a
 * survivor. A booking that commits mid-flight therefore cannot be destroyed: worst case a
 * concurrent booker finds no free slot and gets a clean "slot taken".
 */
export async function generateRange(params: GenerateRangeParams): Promise<GenerateRangeResult> {
  await connectDB();
  const { fromDate, toDate, startTime, endTime, slotMinutes, weekdays } = params;

  if (!Array.isArray(weekdays) || weekdays.length === 0) {
    throw new ValidationError('Select at least one weekday.');
  }
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

  // Snapshot of what already exists, used ONLY to report an accurate slotsCreated count —
  // never to decide what to write, so it cannot reintroduce a read-modify-write race.
  const before = await ConsultationSchedule.find({ date: { $in: targetDates } });
  const existingKeys = new Map(before.map((doc) => [doc.date, new Set(doc.slots.map(slotKey))]));

  // 1. Remove only slots that are free AND open. A booked or admin-closed slot cannot match.
  const pulls: BulkOps = targetDates.map((date) => ({
    updateOne: { filter: { date }, update: { $pull: { slots: REMOVABLE_SLOT } }, upsert: true },
  }));
  await ConsultationSchedule.bulkWrite(pulls);

  // 2. Re-read the survivors, then 3. push only the template slots that do not collide with one.
  const survivors = await ConsultationSchedule.find({ date: { $in: targetDates } });
  const survivorsByDate = new Map(survivors.map((doc) => [doc.date, doc.slots]));

  const pushes: BulkOps = [];
  let slotsCreated = 0;
  let bookingsPreserved = 0;

  for (const date of targetDates) {
    const kept = survivorsByDate.get(date) ?? [];
    bookingsPreserved += kept.filter((slot) => slot.leadId !== null).length;

    const keptRanges = rangesOf(kept);
    const fresh = template.filter((_, index) => !overlapsAny(templateRanges[index], keptRanges)).map(freshSlot);
    if (fresh.length === 0) continue;

    const known = existingKeys.get(date) ?? new Set<string>();
    slotsCreated += fresh.filter((slot) => !known.has(slotKey(slot))).length;
    pushes.push({ updateOne: { filter: { date }, update: { $push: { slots: { $each: fresh } } } } });
  }
  if (pushes.length > 0) {
    await ConsultationSchedule.bulkWrite(pushes);
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
    throw new ValidationError('Month must be in YYYY-MM format.');
  }
  const schedules = await ConsultationSchedule.find({ date: { $gte: `${month}-01`, $lte: `${month}-31` } });
  const availability: Record<string, number> = {};
  for (const schedule of schedules) {
    availability[schedule.date] = schedule.slots.filter(isFree).length;
  }
  return availability;
}

/**
 * Replaces one day's slots (admin hand-edit). Refuses to drop a booked slot, and uses the same
 * pull-survivors-push shape as generateRange so a concurrent booking is never overwritten.
 */
export async function replaceDay(date: string, slots: SlotTime[]): Promise<IConsultationSchedule> {
  await connectDB();
  if (!DATE_PATTERN.test(date)) {
    throw new ValidationError('Date must be in YYYY-MM-DD format.');
  }
  if (!Array.isArray(slots)) {
    throw new ValidationError('Slots must be a list.');
  }
  const incomingRanges = toRanges(slots);

  const existing = await ConsultationSchedule.findOne({ date });
  const booked = (existing?.slots ?? []).filter((slot) => slot.leadId !== null);
  const incomingTimes = new Set(slots.map((slot) => slot.startTime));
  const dropped = booked.filter((slot) => !incomingTimes.has(slot.startTime));
  if (dropped.length > 0) {
    throw new ValidationError(
      `Cannot remove ${dropped.length} slot(s) that already have a booking. Cancel the booking first.`,
    );
  }

  await ConsultationSchedule.updateOne({ date }, { $pull: { slots: REMOVABLE_SLOT } }, { upsert: true });
  const survivors = await ConsultationSchedule.findOne({ date });
  const keptRanges = rangesOf(survivors?.slots ?? []);
  const fresh = slots.filter((_, index) => !overlapsAny(incomingRanges[index], keptRanges)).map(freshSlot);
  if (fresh.length === 0) {
    return survivors as IConsultationSchedule;
  }

  const updated = await ConsultationSchedule.findOneAndUpdate(
    { date },
    { $push: { slots: { $each: fresh } } },
    { upsert: true, returnDocument: 'after' },
  );
  return updated as IConsultationSchedule;
}

/**
 * Atomically claims a slot. Returns false if it was already taken or does not exist.
 *
 * This is a SINGLE conditional update on purpose. A check-then-write would leave a
 * gap in which two concurrent bookers could both pass the check. Mongo guarantees
 * only one of them matches this filter.
 */
export async function claimSlot(date: string, startTime: string, leadId: mongoose.Types.ObjectId): Promise<boolean> {
  await connectDB();
  const result = await ConsultationSchedule.updateOne(
    { date, slots: { $elemMatch: { startTime, isAvailable: true, leadId: null } } },
    { $set: { 'slots.$.leadId': leadId } },
  );
  return result.modifiedCount === 1;
}

/** Returns a slot to the pool. Used when a booking is cancelled, or to roll back a failed booking. */
export async function releaseSlot(date: string, startTime: string): Promise<void> {
  await connectDB();
  await ConsultationSchedule.updateOne(
    { date, slots: { $elemMatch: { startTime } } },
    { $set: { 'slots.$.leadId': null } },
  );
}

/** Latest date that has any slots at all — drives the admin runway banner. */
export async function getGeneratedThrough(): Promise<string | null> {
  await connectDB();
  const latest = await ConsultationSchedule.findOne({ 'slots.0': { $exists: true } }).sort({ date: -1 });
  return latest?.date ?? null;
}
