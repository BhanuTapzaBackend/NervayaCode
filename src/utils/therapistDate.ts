/**
 * Date helpers for the therapist calendar, anchored to IST.
 *
 * Sessions store wall-clock IST (`date: 'YYYY-MM-DD'` + `startTime: '5:00 PM'`),
 * so "today" and "this week" must be computed in IST rather than the viewer's
 * timezone — otherwise a therapist travelling, or a browser reporting UTC, sees
 * the wrong day highlighted and the wrong week loaded.
 */

const IST_TIMEZONE = 'Asia/Kolkata';
export const DAY_MS = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` for the IST calendar day containing this instant. */
export function toIsoDayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Midnight IST at the start of the day containing `date`. */
export function startOfIstDay(date: Date): Date {
  return new Date(`${toIsoDayKey(date)}T00:00:00+05:30`);
}

const MONDAY_FIRST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: IST_TIMEZONE, weekday: 'short' });

/** 0 = Monday … 6 = Sunday, in IST. The grid runs MON–SUN. */
export function istWeekdayIndex(date: Date): number {
  return MONDAY_FIRST.indexOf(weekdayFormatter.format(date));
}

/** Monday-anchored week start, in IST. */
export function getIstWeekStart(date: Date): Date {
  const dayStart = startOfIstDay(date);
  return addDays(dayStart, -istWeekdayIndex(dayStart));
}

export function addDays(date: Date, days: number): Date {
  // Re-anchor through the day key so a DST-style shift could never accumulate.
  // IST has no DST, but this keeps the helper honest if the timezone ever moves.
  return startOfIstDay(new Date(date.getTime() + days * DAY_MS));
}

export function isSameIstDay(a: Date, b: Date): boolean {
  return toIsoDayKey(a) === toIsoDayKey(b);
}

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIMEZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function formatIstTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatIstTimeRange(startIso: string, endIso: string): string {
  return `${timeFormatter.format(new Date(startIso))} – ${timeFormatter.format(new Date(endIso))}`;
}

const shortDateFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIMEZONE,
  month: 'short',
  day: 'numeric',
});
const shortDateYearFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIMEZONE,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const yearFormatter = new Intl.DateTimeFormat('en-IN', { timeZone: IST_TIMEZONE, year: 'numeric' });
const longDayFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIMEZONE,
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

/** e.g. "24 Aug – 30 Aug, 2026" (en-IN is day-first). */
export function formatRangeLabel(start: Date, days: number): string {
  const end = addDays(start, days - 1);

  if (days === 1) {
    return `${longDayFormatter.format(start)}, ${yearFormatter.format(start)}`;
  }

  // A week spanning New Year needs both years, or "29 Dec – 4 Jan, 2027"
  // silently backdates December by a year.
  if (yearFormatter.format(start) !== yearFormatter.format(end)) {
    return `${shortDateYearFormatter.format(start)} – ${shortDateYearFormatter.format(end)}`;
  }
  return `${shortDateFormatter.format(start)} – ${shortDateFormatter.format(end)}, ${yearFormatter.format(end)}`;
}

// Hoisted like every other formatter here. Constructing an Intl.DateTimeFormat
// is ~55x the cost of using one, and this is called from inside a sort
// comparator — a 30-session week was ~500 constructions per render.
const minuteFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: IST_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Minutes since IST midnight — the vertical position of an event in the grid. */
export function istMinutesOfDay(iso: string): number {
  const [hours, minutes] = minuteFormatter.format(new Date(iso)).split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * End-of-event minutes, unwrapped past midnight.
 *
 * `istMinutesOfDay` is minutes-of-DAY, so an 11pm–midnight session reports an
 * end of 0. Left alone that inverts every duration and height calculation and
 * collapses the whole grid to a single hour.
 */
export function istEndMinutes(startIso: string, endIso: string): number {
  const start = istMinutesOfDay(startIso);
  const end = istMinutesOfDay(endIso);
  return end <= start ? Math.min(end + 1440, 1440) : end;
}
