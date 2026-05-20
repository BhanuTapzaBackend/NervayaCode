import { timeToMinutes, minutesToTime, formatDate } from '@/lib/utils/scheduleTime.util';
import { type TimeSlot } from '@/lib/api/schedule';

/** Hours displayed on the calendar (7 AM to 9 PM) */
export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 21;
export const HOUR_HEIGHT = 60; // px per hour row

/** Convert a 12h time string to a pixel offset from the top of the grid. */
export function timeToPixelOffset(timeStr: string): number {
  const totalMinutes = timeToMinutes(timeStr);
  const dayStartMinutes = DAY_START_HOUR * 60;
  const offsetMinutes = totalMinutes - dayStartMinutes;
  return (offsetMinutes / 60) * HOUR_HEIGHT;
}

/** Compute height in px for a slot given start/end times. */
export function slotHeightPx(startTime: string, endTime: string): number {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const durationMin = endMin - startMin;
  return (durationMin / 60) * HOUR_HEIGHT;
}

/** Get the 7 dates of the week starting from weekStart (Monday). */
export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Format a Date to YYYY-MM-DD. */
export function toDateStr(date: Date): string {
  return formatDate(date);
}

/** Get Monday of the week containing the given date. */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Sunday → go back 6 days
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format a week label like "Apr 7 - 13, 2026". */
export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startMonth = weekStart.toLocaleString('en-US', { month: 'short' });
  const endMonth = weekEnd.toLocaleString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const year = weekEnd.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

/** Format a day label like "Monday, Apr 7, 2026", useful for Day View. */
export function formatDayLabel(date: Date): string {
  return date.toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

/** Check if two dates are the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Generate hour labels for the time grid. */
export function getHourLabels(): string[] {
  const labels: string[] = [];
  // Skip the first hour (7 AM) to avoid overlap with the header circle top part
  for (let h = DAY_START_HOUR + 1; h <= DAY_END_HOUR; h++) {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    labels.push(`${displayHour} ${period}`);
  }
  return labels;
}

export interface SlotColors {
  bg: string;
  border: string;
  text: string;
}

/**
 * Nervaya-branded slot color scheme.
 * Purple = confirmed (brand accent), Emerald = available,
 * Amber = pending, Rose = blocked, Slate = completed.
 * Updated to use vibrant, high-contrast colors typical of professional SaaS applications (e.g., Google Calendar).
 */
export function getSlotColors(slot: TimeSlot): SlotColors {
  // Completed — muted slate
  if (slot.sessionStatus === 'completed') {
    return {
      bg: 'var(--color-background-alt)',
      border: 'var(--color-text-disabled)',
      text: 'var(--color-text-slate-400)',
    };
  }
  // Confirmed — Nervaya purple
  if (slot.sessionStatus === 'confirmed') {
    return {
      bg: 'rgba(var(--color-accent-rgb), 0.15)',
      border: 'var(--color-accent)',
      text: 'var(--color-accent-hover)',
    };
  }
  // Pending — amber/warm
  if (slot.sessionStatus === 'pending') {
    return { bg: 'rgba(245, 158, 11, 0.15)', border: 'var(--color-warning)', text: 'var(--color-warning-text)' };
  }
  // Blocked — rose/red
  if (!slot.isAvailable && !slot.sessionId) {
    return { bg: 'rgba(239, 68, 68, 0.12)', border: 'var(--color-error)', text: 'var(--color-error-hover)' };
  }
  // Available — emerald/green
  return { bg: 'rgba(16, 185, 129, 0.15)', border: 'var(--color-success)', text: 'var(--color-success)' };
}

/** Get a human-readable label for slot status. */
export function getSlotStatusLabel(slot: TimeSlot): string {
  if (slot.sessionStatus === 'completed') return 'Completed';
  if (slot.sessionStatus === 'confirmed') return 'Confirmed';
  if (slot.sessionStatus === 'pending') return 'Pending';
  if (!slot.isAvailable) return 'Blocked';
  return 'Available';
}

/** Calculate the nearest time slot from a Y-pixel offset (snaps to 30-min). */
export function pixelOffsetToTime(offsetY: number): string {
  const totalMinutes = DAY_START_HOUR * 60 + (offsetY / HOUR_HEIGHT) * 60;
  const snapped = Math.round(totalMinutes / 30) * 30;
  return minutesToTime(snapped);
}
