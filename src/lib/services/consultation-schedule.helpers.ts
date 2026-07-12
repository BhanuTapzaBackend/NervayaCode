import mongoose from 'mongoose';
import type { IConsultationSlotDoc } from '@/lib/models/consultationSchedule.model';
import { ValidationError } from '@/lib/utils/error.util';
import { displayToMinutes, MAX_RANGE_DAYS } from '@/lib/utils/consultation-time.util';
import type { SlotTime } from '@/types/consultation.types';

/**
 * Private helpers for consultation-schedule.service. Not part of the service's public surface —
 * they exist only to keep the service file small. Validation lives here but is always driven by,
 * and throws out of, the service layer.
 */

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Month must be a real month: '2099-13' is not one, so the shape alone is not enough. */
export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY_MS = 86_400_000;

/** How many times a version-guarded write re-reads and retries before giving up with a ConflictError. */
export const MAX_WRITE_ATTEMPTS = 5;

export interface MinuteRange {
  start: number;
  end: number;
}

export type FreshSlot = SlotTime & { isAvailable: true; leadId: null };

/** What a merge does when an incoming slot collides with a slot that must be preserved. */
export type OverlapPolicy = 'skip' | 'reject';

export interface MergeOutcome {
  /** The complete slot array the day should now hold. */
  slots: IConsultationSlotDoc[];
  /** Slots genuinely new to this day — never counts a slot that was already there. */
  added: number;
  bookingsPreserved: number;
}

/** A slot is bookable only if the admin left it open AND nobody has taken it. */
export function isFree(slot: { isAvailable: boolean; leadId: mongoose.Types.ObjectId | null }): boolean {
  return slot.isAvailable && slot.leadId === null;
}

/** Read paths must never 500 on odd stored data, so an unparseable time simply sorts last. */
export function sortByTime<T extends { startTime: string }>(slots: T[]): T[] {
  const key = (value: string): number => {
    try {
      return displayToMinutes(value);
    } catch {
      return Number.MAX_SAFE_INTEGER;
    }
  };
  return [...slots].sort((a, b) => key(a.startTime) - key(b.startTime));
}

function parseTime(value: string, label: string): number {
  try {
    return displayToMinutes(value);
  } catch {
    throw new ValidationError(`Invalid ${label} "${value}". Expected a time like "9:00 AM".`);
  }
}

/**
 * Validates every incoming slot: rejects malformed times, a non-positive duration,
 * duplicate start times (which would let two people book one slot) and overlaps.
 * Nothing malformed may ever reach the database.
 */
export function toRanges(slots: SlotTime[]): MinuteRange[] {
  const ranges = slots.map((slot) => {
    const start = parseTime(slot.startTime, 'start time');
    const end = parseTime(slot.endTime, 'end time');
    if (end <= start) {
      throw new ValidationError(`Slot "${slot.startTime} - ${slot.endTime}" must end after it starts.`);
    }
    return { start, end };
  });

  let previousStart = -1;
  let coveredUntil = -1;
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    if (range.start === previousStart) {
      throw new ValidationError('Two slots cannot start at the same time.');
    }
    if (range.start < coveredUntil) {
      throw new ValidationError('Slots cannot overlap each other.');
    }
    previousStart = range.start;
    coveredUntil = Math.max(coveredUntil, range.end);
  }
  return ranges;
}

/** A stored slot's minute range, or null when a malformed legacy time makes it incomparable. */
function rangeOrNull(slot: SlotTime): MinuteRange | null {
  try {
    return { start: displayToMinutes(slot.startTime), end: displayToMinutes(slot.endTime) };
  } catch {
    return null;
  }
}

/** Two ranges overlap when each starts before the other ends — not merely when they share a start. */
function overlaps(a: MinuteRange, b: MinuteRange): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Identity of a slot in the day, used to tell a genuinely new slot from one that already existed. */
export function slotKey(slot: SlotTime): string {
  return `${slot.startTime}|${slot.endTime}`;
}

export function freshSlot(slot: SlotTime): FreshSlot {
  return { startTime: slot.startTime, endTime: slot.endTime, isAvailable: true, leadId: null };
}

/** The slots a rewrite may never drop: booked by someone, or deliberately closed by an admin. */
function isPreserved(slot: IConsultationSlotDoc): boolean {
  return slot.leadId !== null || !slot.isAvailable;
}

/** Strips Mongoose internals so the merged array can be written back as a plain value. */
function plainSlot(slot: IConsultationSlotDoc): IConsultationSlotDoc {
  return {
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: slot.isAvailable,
    leadId: slot.leadId ?? null,
  };
}

/**
 * Computes the day's next slot array: every preserved slot carried over verbatim, plus each
 * incoming slot that does not overlap one of them. An incoming slot identical to a preserved slot
 * is not a collision — it is the same slot, already carried over.
 *
 * `skip` (bulk generate) fills in around a preserved slot. `reject` (admin hand-edit) refuses,
 * so the admin is told about the conflict rather than silently losing the slot they submitted.
 */
export function mergeSlots(
  existing: IConsultationSlotDoc[],
  incoming: SlotTime[],
  incomingRanges: MinuteRange[],
  onOverlap: OverlapPolicy,
): MergeOutcome {
  const preserved = existing.filter(isPreserved).map(plainSlot);
  const preservedRanges = preserved.map(rangeOrNull);
  const preservedKeys = new Set(preserved.map(slotKey));
  const existingKeys = new Set(existing.map(slotKey));

  const fresh: IConsultationSlotDoc[] = [];
  incoming.forEach((slot, index) => {
    if (preservedKeys.has(slotKey(slot))) return;

    // Fail CLOSED on a preserved slot whose time will not parse: treat it as
    // clashing with everything rather than with nothing. Skipping it would let a
    // second slot be added alongside a booked-but-malformed one, and claimSlot's
    // positional `$` would hand the duplicate to a second customer.
    const clashIndex = preservedRanges.findIndex((range) => range === null || overlaps(incomingRanges[index], range));
    if (clashIndex !== -1) {
      if (onOverlap === 'reject') {
        const clash = preserved[clashIndex];
        const reason = clash.leadId !== null ? 'is already booked' : 'was closed';
        throw new ValidationError(
          `Slot "${slot.startTime} - ${slot.endTime}" overlaps "${clash.startTime} - ${clash.endTime}", ` +
            `which ${reason}. Cancel or move that slot first.`,
        );
      }
      return;
    }
    fresh.push(freshSlot(slot));
  });

  return {
    slots: sortByTime([...preserved, ...fresh]),
    added: fresh.filter((slot) => !existingKeys.has(slotKey(slot))).length,
    bookingsPreserved: preserved.filter((slot) => slot.leadId !== null).length,
  };
}

/**
 * Order-independent canonical form of a day's slots. A regenerate that would change nothing can
 * then skip its write entirely, which keeps repeated/concurrent generates from fighting over `__v`.
 */
export function slotsFingerprint(slots: IConsultationSlotDoc[]): string {
  return slots
    .map((slot) => `${slot.startTime}|${slot.endTime}|${slot.isAvailable}|${slot.leadId?.toString() ?? ''}`)
    .sort()
    .join(',');
}

/** A losing race on the unique `date` index — the day was created by someone else a moment ago. */
export function isDuplicateKeyError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }
  return error.code === 11000;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

export function assertValidDate(date: string): void {
  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new ValidationError('Date must be a real date in YYYY-MM-DD format.');
  }
}

/** 0=Sunday .. 6=Saturday. An out-of-range day would otherwise match no date and silently no-op. */
export function assertWeekdays(weekdays: number[]): void {
  if (!Array.isArray(weekdays) || weekdays.length === 0) {
    throw new ValidationError('Select at least one weekday.');
  }
  for (const weekday of weekdays) {
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      throw new ValidationError(`Invalid weekday "${weekday}". Use 0 (Sunday) through 6 (Saturday).`);
    }
  }
}

/** Rejects an oversized span BEFORE it is expanded into a date array. */
export function assertSpanWithinLimit(fromDate: string, toDate: string): void {
  assertValidDate(fromDate);
  assertValidDate(toDate);
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);
  if (to < from) {
    throw new ValidationError('End date must not be before start date.');
  }
  if (Math.round((to - from) / DAY_MS) + 1 > MAX_RANGE_DAYS) {
    throw new ValidationError(`Range is too large. Generate at most ${MAX_RANGE_DAYS} days at a time.`);
  }
}
