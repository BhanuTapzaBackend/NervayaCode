import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import ConsultationSchedule, { type IConsultationSchedule } from '@/lib/models/consultationSchedule.model';
import { ValidationError } from '@/lib/utils/error.util';
import {
  buildSlots,
  displayToMinutes,
  eachDateInRange,
  weekdayOf,
  MAX_RANGE_DAYS,
} from '@/lib/utils/consultation-time.util';
import type { GenerateRangeParams, GenerateRangeResult, PublicSlot, SlotTime } from '@/types/consultation.types';

/** A slot is bookable only if the admin left it open AND nobody has taken it. */
function isFree(slot: { isAvailable: boolean; leadId: mongoose.Types.ObjectId | null }): boolean {
  return slot.isAvailable && slot.leadId === null;
}

function sortByTime<T extends { startTime: string }>(slots: T[]): T[] {
  return [...slots].sort((a, b) => displayToMinutes(a.startTime) - displayToMinutes(b.startTime));
}

/**
 * Bulk-generates slots across a date range.
 * Booked slots are always preserved, even if they fall outside the new window —
 * re-running generate must never orphan someone's booking.
 */
export async function generateRange(params: GenerateRangeParams): Promise<GenerateRangeResult> {
  await connectDB();
  const { fromDate, toDate, startTime, endTime, slotMinutes, weekdays } = params;

  if (!Array.isArray(weekdays) || weekdays.length === 0) {
    throw new ValidationError('Select at least one weekday.');
  }

  let dates: string[];
  let template: SlotTime[];
  try {
    dates = eachDateInRange(fromDate, toDate);
    template = buildSlots(startTime, endTime, slotMinutes);
  } catch (error) {
    throw new ValidationError(error instanceof Error ? error.message : 'Invalid range.');
  }

  if (dates.length > MAX_RANGE_DAYS) {
    throw new ValidationError(`Range is too large. Generate at most ${MAX_RANGE_DAYS} days at a time.`);
  }
  if (template.length === 0) {
    throw new ValidationError('That window is shorter than one slot. Widen it or shorten the slot length.');
  }

  const targetDates = dates.filter((date) => weekdays.includes(weekdayOf(date)));
  const existing = await ConsultationSchedule.find({ date: { $in: targetDates } });
  const existingByDate = new Map(existing.map((doc) => [doc.date, doc]));

  let slotsCreated = 0;
  let bookingsPreserved = 0;

  const operations = targetDates.map((date) => {
    const previous = existingByDate.get(date);
    const booked = (previous?.slots ?? []).filter((slot) => slot.leadId !== null);
    const bookedTimes = new Set(booked.map((slot) => slot.startTime));

    const fresh = template
      .filter((slot) => !bookedTimes.has(slot.startTime))
      .map((slot) => ({ ...slot, isAvailable: true, leadId: null }));

    slotsCreated += fresh.length;
    bookingsPreserved += booked.length;

    return {
      updateOne: {
        filter: { date },
        update: { $set: { date, slots: sortByTime([...booked, ...fresh]) } },
        upsert: true,
      },
    };
  });

  if (operations.length > 0) {
    await ConsultationSchedule.bulkWrite(operations);
  }

  return { datesGenerated: targetDates.length, slotsCreated, bookingsPreserved };
}

export async function getRange(fromDate: string, toDate: string): Promise<IConsultationSchedule[]> {
  await connectDB();
  return ConsultationSchedule.find({ date: { $gte: fromDate, $lte: toDate } }).sort({ date: 1 });
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

/** date -> count of free slots, for the calendar's "N slots left" badges. */
export async function getMonthAvailability(month: string): Promise<Record<string, number>> {
  await connectDB();
  const schedules = await ConsultationSchedule.find({ date: { $regex: `^${month}-` } });
  const availability: Record<string, number> = {};
  for (const schedule of schedules) {
    availability[schedule.date] = schedule.slots.filter(isFree).length;
  }
  return availability;
}

/** Replaces one day's slots (admin hand-edit). Refuses to drop a booked slot. */
export async function replaceDay(date: string, slots: SlotTime[]): Promise<IConsultationSchedule> {
  await connectDB();
  const existing = await ConsultationSchedule.findOne({ date });
  const booked = (existing?.slots ?? []).filter((slot) => slot.leadId !== null);
  const incomingTimes = new Set(slots.map((slot) => slot.startTime));

  const dropped = booked.filter((slot) => !incomingTimes.has(slot.startTime));
  if (dropped.length > 0) {
    throw new ValidationError(
      `Cannot remove ${dropped.length} slot(s) that already have a booking. Cancel the booking first.`,
    );
  }

  const bookedTimes = new Set(booked.map((slot) => slot.startTime));
  const merged = [
    ...booked,
    ...slots
      .filter((slot) => !bookedTimes.has(slot.startTime))
      .map((slot) => ({ ...slot, isAvailable: true, leadId: null })),
  ];

  const updated = await ConsultationSchedule.findOneAndUpdate(
    { date },
    { $set: { date, slots: sortByTime(merged) } },
    { upsert: true, new: true },
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
  const result = await ConsultationSchedule.findOneAndUpdate(
    { date, slots: { $elemMatch: { startTime, isAvailable: true, leadId: null } } },
    { $set: { 'slots.$.leadId': leadId } },
    { new: true },
  );
  return result !== null;
}

/** Returns a slot to the pool. Used when a booking is cancelled, or to roll back a failed booking. */
export async function releaseSlot(date: string, startTime: string): Promise<void> {
  await connectDB();
  await ConsultationSchedule.findOneAndUpdate(
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
