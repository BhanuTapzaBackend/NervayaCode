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
