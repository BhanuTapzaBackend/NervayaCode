// Sessions store wall-clock time in IST (Asia/Kolkata, +05:30). Anchoring to that offset
// makes the comparison correct on the server (often UTC) and in any client timezone.
const IST_OFFSET = '+05:30';

/**
 * Hoisted: constructing an Intl formatter is comparatively expensive and this
 * runs per session on list endpoints.
 *
 * `hour: '2-digit'` on purpose — it yields "09:30 AM", matching `convert24To12`
 * in time.util.ts, which produces every slot and consulting-hours string in the
 * app. With 'numeric' this was the only writer emitting "9:30 AM", so
 * `Session.endTime` stored a shape no other code produced.
 */
const IST_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

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

/**
 * The wall-clock end time for a session, as the 12-hour string the schema stores.
 *
 * Three call sites used to compute this by hand as `start + 1 hour`, which was
 * wrong twice over. It ignored `Therapist.sessionDurationMins` — so a 30-minute
 * therapist got a 60-minute Session row beside a 30-minute calendar event, and
 * the dashboard drew a block twice its real length, flagging the next genuine
 * booking as an overlap. And at 11:00 PM the modulo wrapped to "12:00 AM",
 * which resolves to midnight at the START of the same day: an endTime 23 hours
 * BEFORE its start, which the dashboard rendered as a "0 min" session.
 *
 * Clamped to 11:59 PM so a session can never wrap past midnight into a time
 * that reads as earlier than it began.
 */
export function computeSessionEndTime(date: string, startTime: string, durationMins?: number): string {
  const start = getSlotInstant(date, startTime);
  // `|| 60` not `??`: the Therapist schema defaults sessionDurationMins to 0.
  const minutes = durationMins || 60;
  if (!start) return startTime;

  const end = new Date(start.getTime() + minutes * 60_000);
  const dayEnd = new Date(`${date}T23:59:00+05:30`);
  const clamped = end > dayEnd ? dayEnd : end;

  return IST_TIME_FORMAT.format(clamped);
}
