// Sessions store wall-clock time in IST (Asia/Kolkata, +05:30). Anchoring to that offset
// makes the comparison correct on the server (often UTC) and in any client timezone.
const IST_OFFSET = '+05:30';

/** Absolute instant of a slot's IST wall-clock time ("2026-06-18" + "9:00 AM"), or null. */
export function getSlotInstant(date: string, startTime: string): Date | null {
  if (!date || !startTime) return null;
  const timeMatch = startTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!timeMatch) return null;
  const hour12 = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour12 < 1 || hour12 > 12 || minute < 0 || minute > 59) return null;
  let hour24 = hour12 % 12;
  if (timeMatch[3].toUpperCase() === 'PM') hour24 += 12;
  const instant = new Date(
    `${date}T${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00${IST_OFFSET}`,
  );
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/** True when the slot's start time is now or in the past — it cannot be booked. */
export function isSlotInPast(date: string, startTime: string): boolean {
  const instant = getSlotInstant(date, startTime);
  return instant !== null && instant.getTime() <= Date.now();
}

/**
 * @deprecated Use `getSlotInstant`. Kept only as a thin alias so no caller
 * silently keeps the old behaviour.
 *
 * The previous implementation built `new Date(year, month-1, day, h, m)`, which
 * constructs in SERVER-local time — UTC on Vercel. Every "is this session
 * upcoming / joinable now" comparison was therefore 5h30m off in production
 * while looking correct on an IST developer's machine.
 */
export function parseSessionStartDateTime(date: string, startTime: string): Date | null {
  return getSlotInstant(date, startTime);
}
