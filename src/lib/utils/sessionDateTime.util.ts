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

export function parseSessionStartDateTime(date: string, startTime: string): Date | null {
  if (!date || !startTime) return null;
  const [yearStr, monthStr, dayStr] = date.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;

  const timeMatch = startTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!timeMatch) return null;
  const hour12 = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const period = timeMatch[3].toUpperCase();

  if (!Number.isFinite(hour12) || hour12 < 1 || hour12 > 12) return null;
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) return null;

  let hour24 = hour12 % 12;
  if (period === 'PM') hour24 += 12;

  const dt = new Date(year, month - 1, day, hour24, minute, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}
