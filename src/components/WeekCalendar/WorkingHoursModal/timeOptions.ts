import type { SelectOption } from '@/components/common/Select/Select';

/**
 * Half-hour options across the day, labelled in 12-hour form.
 *
 * Values are the same `"9:00 AM"` strings `ConsultingHour` already stores, so
 * nothing has to convert on the way in or out. The previous editor used
 * `<input type="time">`, which meant round-tripping through 24-hour strings on
 * every keystroke and rendering differently per browser and locale — on a
 * 24-hour locale it showed "17:00" for hours the rest of the app calls "5:00 PM".
 */
export const TIME_OPTIONS: SelectOption[] = Array.from({ length: 48 }, (_, index) => {
  const hour24 = Math.floor(index / 2);
  const minute = index % 2 === 0 ? '00' : '30';
  const period = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const label = `${hour12}:${minute} ${period}`;
  return { value: label, label };
});

/** Minutes since midnight, for comparing two 12-hour strings. */
export function toMinutes(time: string): number {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return -1;

  const hour12 = Number(match[1]) % 12;
  const minute = Number(match[2]);
  const isPm = match[3].toUpperCase() === 'PM';
  return (hour12 + (isPm ? 12 : 0)) * 60 + minute;
}

/**
 * Normalises a stored value onto the half-hour grid so the Select can show it.
 *
 * Existing data may hold times the options list doesn't contain (`"09:15 AM"`,
 * or a zero-padded `"09:00 AM"` where options use `"9:00 AM"`). Radix Select
 * renders a blank trigger for a value with no matching item, so an un-normalised
 * value would look like the day had no start time at all.
 */
export function normalizeToOption(time: string | undefined): string {
  if (!time) return TIME_OPTIONS[18].value; // 9:00 AM

  const target = toMinutes(time);
  if (target < 0) return TIME_OPTIONS[18].value;

  let closest = TIME_OPTIONS[0];
  let smallestGap = Number.POSITIVE_INFINITY;
  for (const option of TIME_OPTIONS) {
    const gap = Math.abs(toMinutes(option.value) - target);
    if (gap < smallestGap) {
      smallestGap = gap;
      closest = option;
    }
  }
  return closest.value;
}
