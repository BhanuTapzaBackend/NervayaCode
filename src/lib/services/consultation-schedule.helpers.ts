import mongoose from 'mongoose';
import type { IConsultationSchedule, IConsultationSlotDoc } from '@/lib/models/consultationSchedule.model';
import { ValidationError } from '@/lib/utils/error.util';
import { displayToMinutes, MAX_RANGE_DAYS } from '@/lib/utils/consultation-time.util';
import type { SlotTime } from '@/types/consultation.types';

/**
 * Private helpers for consultation-schedule.service. Not part of the service's public surface —
 * they exist only to keep the service file small. Validation lives here but is always driven by,
 * and throws out of, the service layer.
 */

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const DAY_MS = 86_400_000;

/**
 * The ONLY slots a rewrite may remove: free (nobody booked it) AND open (admin left it on).
 * A booked slot or an admin-closed slot cannot match this filter, so it can never be pulled.
 */
export const REMOVABLE_SLOT = { leadId: null, isAvailable: true } as const;

export interface MinuteRange {
  start: number;
  end: number;
}

export type FreshSlot = SlotTime & { isAvailable: true; leadId: null };
export type BulkOps = mongoose.AnyBulkWriteOperation<IConsultationSchedule>[];

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

/** Minute ranges of the slots that survived a pull. An unparseable legacy slot cannot block anything. */
export function rangesOf(slots: IConsultationSlotDoc[]): MinuteRange[] {
  const ranges: MinuteRange[] = [];
  for (const slot of slots) {
    try {
      ranges.push({ start: displayToMinutes(slot.startTime), end: displayToMinutes(slot.endTime) });
    } catch {
      // Malformed legacy time: not comparable, so it is skipped rather than crashing the write.
    }
  }
  return ranges;
}

/** Two ranges overlap when each starts before the other ends — not merely when they share a start. */
export function overlapsAny(candidate: MinuteRange, ranges: MinuteRange[]): boolean {
  return ranges.some((range) => candidate.start < range.end && range.start < candidate.end);
}

/** Identity of a slot in the day, used to tell a genuinely new slot from one that already existed. */
export function slotKey(slot: SlotTime): string {
  return `${slot.startTime}|${slot.endTime}`;
}

export function freshSlot(slot: SlotTime): FreshSlot {
  return { startTime: slot.startTime, endTime: slot.endTime, isAvailable: true, leadId: null };
}

/** Rejects an oversized span BEFORE it is expanded into a date array. */
export function assertSpanWithinLimit(fromDate: string, toDate: string): void {
  if (!DATE_PATTERN.test(fromDate) || !DATE_PATTERN.test(toDate)) {
    throw new ValidationError('Dates must be valid and in YYYY-MM-DD format.');
  }
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) {
    throw new ValidationError('Dates must be valid and in YYYY-MM-DD format.');
  }
  if (to < from) {
    throw new ValidationError('End date must not be before start date.');
  }
  if (Math.round((to - from) / DAY_MS) + 1 > MAX_RANGE_DAYS) {
    throw new ValidationError(`Range is too large. Generate at most ${MAX_RANGE_DAYS} days at a time.`);
  }
}
