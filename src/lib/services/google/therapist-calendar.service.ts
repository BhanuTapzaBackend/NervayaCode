import type { calendar_v3 } from 'googleapis';

import Session from '@/lib/models/session.model';
import Therapist from '@/lib/models/therapist.model';
import connectDB from '@/lib/db/mongodb';
import { SESSION_STATUS } from '@/lib/constants/enums';
import { getSlotInstant } from '@/lib/utils/sessionDateTime.util';
import { hasCalendarCredentials } from './google-client.service';
import { listCalendarEvents } from './google-calendar-events.service';
import {
  EVENT_TAG_KEYS,
  buildTherapistEventFilter,
  resolveCalendarOwner,
  type CalendarOwner,
} from './calendar-owner.service';

/**
 * The therapist's calendar, read DB-first.
 *
 * Google is NOT called on every render. Sessions we booked are already in our
 * own database, so they are served straight from it; Google is consulted only
 * to pick up what our DB cannot know about — events the therapist created or
 * moved on their own calendar — and only when something suggests it is stale.
 */

/** How long a Google read stays fresh before another is allowed. */
const CALENDAR_TTL_MS = 5 * 60 * 1000;

export interface TherapistCalendarEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  /** 'nervaya' events came from a booking; 'external' are the therapist's own. */
  origin: 'nervaya' | 'external';
  sessionId?: string;
  meetLink?: string;
  status?: string;
}

export interface TherapistCalendarResult {
  events: TherapistCalendarEvent[];
  /** 'own' means their real calendar; 'shared' means a filtered slice of ours. */
  mode: CalendarOwner['mode'];
  calendarEmail: string;
  /** True when Google was not consulted (cache hit, or not configured). */
  fromCache: boolean;
  syncedAt: string | null;
  /** Set when Google could not be reached; the DB rows are still returned. */
  warning?: string;
}

/**
 * Per-therapist freshness marker.
 *
 * In-process rather than a collection: a stale read costs one extra Google call
 * on the next request, which is not worth a schema for. If this ever needs to
 * survive a cold start or coordinate across instances, promote it to a
 * `therapistCalendarSync` document keyed on therapistId.
 */
const lastSyncedAt = new Map<string, number>();
const lastSessionCount = new Map<string, number>();

/** Our own sessions in the window — the authoritative copy, no Google needed. */
async function loadSessionEvents(
  therapistId: string,
  start: Date,
  end: Date,
  durationMins: number,
): Promise<TherapistCalendarEvent[]> {
  const sessions = await Session.find({
    therapistId,
    status: { $ne: SESSION_STATUS.CANCELLED },
    date: { $gte: toDateKey(start), $lte: toDateKey(end) },
  })
    .select('_id date startTime endTime status meetLink')
    .lean();

  return sessions.flatMap((session) => {
    const startAt = getSlotInstant(session.date, session.startTime);
    if (!startAt) return [];

    const endAt =
      getSlotInstant(session.date, session.endTime ?? '') ?? new Date(startAt.getTime() + durationMins * 60_000);

    return [
      {
        id: `session-${session._id.toString()}`,
        title: 'Therapy session',
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        origin: 'nervaya' as const,
        sessionId: session._id.toString(),
        meetLink: session.meetLink || undefined,
        status: session.status,
      },
    ];
  });
}

function toDateKey(date: Date): string {
  // IST calendar day, matching how Session.date is stored.
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * The exact instants spanned by the IST calendar days the DB query covers.
 *
 * The DB filters on IST day KEYS while Google takes absolute instants. Passing
 * the raw request instants to Google made the two windows disagree by up to
 * ~18 hours, so the reconciliation below reported sessions as "missing from
 * Google Calendar" that were simply outside the narrower Google window —
 * training ops to ignore the one warning meant to catch real drift.
 */
function istDayBounds(start: Date, end: Date): { timeMin: Date; timeMax: Date } {
  return {
    timeMin: new Date(`${toDateKey(start)}T00:00:00+05:30`),
    timeMax: new Date(`${toDateKey(end)}T23:59:59+05:30`),
  };
}

/** Maps a Google event, dropping the ones we already have from our own DB. */
function toCalendarEvent(event: calendar_v3.Schema$Event): TherapistCalendarEvent | null {
  const startAt = event.start?.dateTime ?? event.start?.date;
  const endAt = event.end?.dateTime ?? event.end?.date;
  if (!event.id || !startAt || !endAt) return null;

  const tags = event.extendedProperties?.private ?? {};
  const refId = tags[EVENT_TAG_KEYS.REF_ID];

  return {
    id: event.id,
    title: event.summary ?? 'Busy',
    startAt: new Date(startAt).toISOString(),
    endAt: new Date(endAt).toISOString(),
    origin: refId ? 'nervaya' : 'external',
    sessionId: refId,
    meetLink: event.hangoutLink ?? undefined,
  };
}

/**
 * Decides whether Google is worth calling.
 *
 * Two triggers, deliberately both:
 *  - the number of sessions we hold for this window changed, which is the
 *    cheap signal that something we caused is out of sync; and
 *  - the cache aged past its TTL, which is the only thing that catches changes
 *    Google knows about and we do not — a therapist dragging an event to a new
 *    time, deleting one, or adding a personal appointment. Counting alone is
 *    blind to every one of those, and to a cancel-plus-rebook that leaves the
 *    count identical.
 */
function shouldRefetch(cacheKey: string, sessionCount: number, force: boolean): boolean {
  if (force) return true;

  const previousCount = lastSessionCount.get(cacheKey);
  if (previousCount !== sessionCount) return true;

  const syncedAt = lastSyncedAt.get(cacheKey);
  return !syncedAt || Date.now() - syncedAt > CALENDAR_TTL_MS;
}

export async function getTherapistCalendar(
  therapistId: string,
  start: Date,
  end: Date,
  options: { force?: boolean } = {},
): Promise<TherapistCalendarResult> {
  await connectDB();

  const therapist = await Therapist.findById(therapistId).select('email sessionDurationMins').lean();
  const owner = resolveCalendarOwner(therapist?.email);
  const durationMins = therapist?.sessionDurationMins || 60;

  // Always start from our own data: it is authoritative for anything we booked
  // and costs nothing.
  const sessionEvents = await loadSessionEvents(therapistId, start, end, durationMins);
  const cacheKey = `${therapistId}:${toDateKey(start)}:${toDateKey(end)}`;

  const base: TherapistCalendarResult = {
    events: sessionEvents,
    mode: owner.mode,
    // Never hand the shared ops mailbox to a therapist client — in shared mode
    // it is not their calendar and the address is not theirs to see.
    calendarEmail: owner.mode === 'own' ? owner.mailbox : '',
    fromCache: true,
    syncedAt: lastSyncedAt.get(cacheKey) ? new Date(lastSyncedAt.get(cacheKey) as number).toISOString() : null,
  };

  if (!hasCalendarCredentials()) return base;

  // In shared mode there is nothing to merge: the therapist filter returns only
  // their own sessions, which we already hold in the database. Reconciliation
  // against Google belongs in a periodic ops job, not on a therapist's render
  // path where it spends the whole platform's shared quota every five minutes.
  if (owner.mode !== 'own') return base;

  if (!shouldRefetch(cacheKey, sessionEvents.length, Boolean(options.force))) return base;

  try {
    // `own` mode only: this calendar belongs to the therapist, so untagged
    // entries are their own appointments and merging them is the point — it
    // makes their availability honest.
    const { timeMin, timeMax } = istDayBounds(start, end);

    const { events } = await listCalendarEvents(owner, {
      timeMin,
      timeMax,
      privateExtendedProperty: buildTherapistEventFilter(owner, therapistId),
    });

    const personalEvents = events
      .map(toCalendarEvent)
      .filter((event): event is TherapistCalendarEvent => event !== null)
      .filter((event) => event.origin === 'external');

    lastSyncedAt.set(cacheKey, Date.now());
    lastSessionCount.set(cacheKey, sessionEvents.length);

    return {
      ...base,
      events: [...sessionEvents, ...personalEvents].sort((a, b) => a.startAt.localeCompare(b.startAt)),
      fromCache: false,
      syncedAt: new Date().toISOString(),
    };
  } catch (error) {
    // A calendar outage must not blank the therapist's schedule — they still
    // get every session we booked, just without their personal events.
    console.error(`[therapist-calendar] Google read failed for ${therapistId}:`, error);
    return { ...base, warning: 'Could not reach Google Calendar; showing booked sessions only.' };
  }
}
