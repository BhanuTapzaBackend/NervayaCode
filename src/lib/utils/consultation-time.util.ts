import type { SlotTime } from '@/types/consultation.types';

const MINUTES_PER_DAY = 24 * 60;
/** Guards the auto-fill range against a runaway request. */
export const MAX_RANGE_DAYS = 366;

/** '09:00' -> 540. Throws on malformed input. */
export function hhmmToMinutes(hhmm: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) {
    throw new Error(`Invalid time: ${hhmm}. Expected HH:MM.`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    throw new Error(`Invalid time: ${hhmm}.`);
  }
  return hours * 60 + minutes;
}

/** 540 -> '9:00 AM'. 12-hour, no leading zero on the hour. */
export function minutesToDisplay(minutes: number): string {
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
}

/** '9:00 AM' -> 540. Used to sort and compare stored slot times. */
export function displayToMinutes(display: string): number {
  const match = /^(\d{1,2}):(\d{2})\s(AM|PM)$/.exec(display.trim());
  if (!match) {
    throw new Error(`Invalid display time: ${display}. Expected e.g. '9:00 AM'.`);
  }
  let hours = Number(match[1]) % 12;
  if (match[3] === 'PM') hours += 12;
  return hours * 60 + Number(match[2]);
}

/** Slices a working window into consecutive slots. A trailing partial slot is dropped. */
export function buildSlots(startTime: string, endTime: string, slotMinutes: number): SlotTime[] {
  const start = hhmmToMinutes(startTime);
  const end = hhmmToMinutes(endTime);
  if (end <= start) {
    throw new Error('End time must be after start time.');
  }
  if (slotMinutes <= 0) {
    throw new Error('Slot length must be greater than zero.');
  }
  const slots: SlotTime[] = [];
  for (let m = start; m + slotMinutes <= end; m += slotMinutes) {
    slots.push({ startTime: minutesToDisplay(m), endTime: minutesToDisplay(m + slotMinutes) });
  }
  return slots;
}

/**
 * Inclusive list of YYYY-MM-DD dates. UTC-based so it never shifts a day
 * across a timezone boundary.
 */
export function eachDateInRange(fromDate: string, toDate: string): string[] {
  const start = new Date(`${fromDate}T00:00:00Z`);
  const end = new Date(`${toDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Dates must be valid and in YYYY-MM-DD format.');
  }
  if (end < start) {
    throw new Error('End date must not be before start date.');
  }
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/** 0=Sunday .. 6=Saturday, for a YYYY-MM-DD string. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}
