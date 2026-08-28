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

/**
 * End times, which deliberately EXCLUDE midnight.
 *
 * "12:00 AM" parses to minute 0, so as a closing time it reads as earlier than
 * every possible start: it marked the day invalid and disabled Save for the
 * whole form, with no way to recover except reopening the editor.
 *
 * The obvious repair — treat it as 24:00 — is worse, because it is only true on
 * the client. `generateTimeSlotsBetween` computes `endMinutes = 0` and its
 * `while (minutes < endMinutes)` loop never runs, so the day would save happily
 * and produce ZERO bookable slots. The therapist grid does not render past
 * 9 PM either. Rather than let the UI promise something two other layers do not
 * honour, midnight is simply not offered; 11:30 PM is the latest close.
 */
export const END_TIME_OPTIONS: SelectOption[] = TIME_OPTIONS.slice(1);

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
 * Snaps a stored value onto the half-hour grid.
 *
 * Existing data may hold times the options list doesn't contain (`"09:15 AM"`,
 * or a zero-padded `"09:00 AM"` where options use `"9:00 AM"`). Radix Select
 * renders a blank trigger for a value with no matching item, so an un-snapped
 * value would look like the day had no start time at all.
 *
 * The caller must write the result back into what it saves. Using it only to
 * render meant a stored `"09:15 AM"` displayed as "9:00 AM" but still saved as
 * 09:15 — the editor showed one thing and persisted another.
 */
export function normalizeToOption(time: string | undefined, kind: 'start' | 'end' = 'start'): string {
  const options = kind === 'end' ? END_TIME_OPTIONS : TIME_OPTIONS;
  const fallback = kind === 'end' ? '5:00 PM' : '9:00 AM';

  if (!time) return fallback;

  const target = toMinutes(time);
  if (target < 0) return fallback;

  // A stored close of midnight meant "to the end of the day". Nearest-match
  // would snap it to 12:30 AM — the small hours of the SAME morning, i.e. a
  // day that closes before it opens. The last selectable close is the honest
  // reading of that intent.
  if (kind === 'end' && target === 0) return options[options.length - 1].value;

  let closest = options[0];
  let smallestGap = Number.POSITIVE_INFINITY;
  for (const option of options) {
    const gap = Math.abs(toMinutes(option.value) - target);
    if (gap < smallestGap) {
      smallestGap = gap;
      closest = option;
    }
  }
  return closest.value;
}
