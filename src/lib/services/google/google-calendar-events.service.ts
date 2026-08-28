import type { calendar_v3 } from 'googleapis';

import { getSlotInstant } from '@/lib/utils/sessionDateTime.util';
import { getCalendarClientFor } from './google-client.service';
import {
  buildEventTags,
  shouldInviteTherapist,
  type CalendarOwner,
  type NervayaEventKind,
} from './calendar-owner.service';

/**
 * Creating and maintaining the Google Calendar events that carry Meet links.
 *
 * Every function takes an already-resolved `CalendarOwner` rather than an email,
 * so the own-vs-shared decision is made once, at the edge, and never re-derived
 * inconsistently here.
 */

const CALENDAR_ID = 'primary';
const IST_TIMEZONE = 'Asia/Kolkata';
const DEFAULT_DURATION_MINS = 60;

export interface CalendarEventInput {
  kind: NervayaEventKind;
  /** Session or consultation id — stamped on the event so we can find it again. */
  refId: string;
  therapistId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "5:00 PM"
  durationMins?: number;
  summary: string;
  description?: string;
  /** Personal address of the therapist, invited when they don't own the calendar. */
  therapistEmail?: string | null;
  customerEmail?: string | null;
}

export interface CalendarEventResult {
  eventId: string;
  meetLink: string;
  startAt: Date;
  endAt: Date;
}

/**
 * Builds the start/end instants for an event.
 *
 * The old implementation did `new Date(\`${date}T${hh}:${mm}:00\`)` with no
 * offset — parsed as SERVER-local time, which on Vercel is UTC, then sent as an
 * ISO string. The adjacent `timeZone: 'Asia/Kolkata'` did not rescue it: when
 * `dateTime` carries an explicit offset Google honours the offset and uses
 * `timeZone` only for display. Every event landed 5h30m off.
 *
 * `getSlotInstant` anchors to +05:30 explicitly, which is correct regardless of
 * where the code runs.
 */
export function computeEventWindow(
  date: string,
  startTime: string,
  durationMins?: number,
): { startAt: Date; endAt: Date } | null {
  const startAt = getSlotInstant(date, startTime);
  if (!startAt) return null;

  // `|| DEFAULT` not `??`: the Therapist schema defaults sessionDurationMins to
  // 0, and `?? 60` would happily create zero-length events for every therapist
  // who never set one.
  const minutes = durationMins || DEFAULT_DURATION_MINS;

  return { startAt, endAt: new Date(startAt.getTime() + minutes * 60_000) };
}

/** Attendees, deduped and lowercased. Empty when we know nobody's address. */
function buildAttendees(input: CalendarEventInput, owner: CalendarOwner): calendar_v3.Schema$EventAttendee[] {
  const emails = new Set<string>();

  if (input.customerEmail?.trim()) emails.add(input.customerEmail.trim().toLowerCase());

  // In `own` mode the therapist IS the organizer, so inviting them is
  // redundant. In `shared` mode the event lives on a mailbox they cannot see —
  // the invite is the only way the Meet link reaches them.
  if (shouldInviteTherapist(owner) && input.therapistEmail?.trim()) {
    emails.add(input.therapistEmail.trim().toLowerCase());
  }

  // Never invite the mailbox that already owns the event.
  emails.delete(owner.mailbox);

  return [...emails].map((email) => ({ email }));
}

/**
 * Deterministic Calendar event id, so a retry cannot create a second event.
 *
 * `conferenceData.createRequest.requestId` only deduplicates the CONFERENCE —
 * `events.insert` itself is not idempotent without an explicit id. Without this,
 * a retryable failure that lands after the write (ECONNRESET, 429, 502) creates
 * a duplicate event and a duplicate invite, and the first one becomes
 * unreachable because we only store the last id.
 *
 * Event ids are base32hex: digits 0-9 and letters a-v ONLY. 'y' and 'z' are
 * invalid, so a "nervaya" prefix would be rejected — hence 'nrv'. A Mongo
 * ObjectId is hex, which is already inside that alphabet.
 */
function buildEventId(kind: NervayaEventKind, refId: string): string {
  return `nrv${kind === 'session' ? 's' : 'c'}${refId.toLowerCase()}`;
}

function extractMeetLink(event: calendar_v3.Schema$Event): string {
  if (event.hangoutLink) return event.hangoutLink;

  // conferenceData is populated asynchronously in some responses; fall back to
  // the video entry point rather than reporting a link-less success.
  const entry = event.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video');
  return entry?.uri ?? '';
}

export async function createCalendarEvent(
  owner: CalendarOwner,
  input: CalendarEventInput,
): Promise<CalendarEventResult> {
  const window = computeEventWindow(input.date, input.startTime, input.durationMins);
  if (!window) throw new Error(`Unparseable session time: ${input.date} ${input.startTime}`);

  const calendar = getCalendarClientFor(owner.mailbox);

  const eventId = buildEventId(input.kind, input.refId);

  const response = await calendar.events
    .insert({
      calendarId: CALENDAR_ID,
      // Required for Google to actually provision the Meet conference.
      conferenceDataVersion: 1,
      // Let Google send the invite, updates and cancellations. Its mails carry a
      // working "add to calendar" affordance we would otherwise hand-roll.
      sendUpdates: 'all',
      requestBody: {
        // Deterministic: makes insert idempotent under retry. See buildEventId.
        id: eventId,
        summary: input.summary,
        description: input.description,
        start: { dateTime: window.startAt.toISOString(), timeZone: IST_TIMEZONE },
        end: { dateTime: window.endAt.toISOString(), timeZone: IST_TIMEZONE },
        attendees: buildAttendees(input, owner),
        // A therapy session is not a group chat: guests must not be able to pull
        // third parties in. On a consumer account a third participant also caps
        // the whole call at 60 minutes.
        guestsCanInviteOthers: false,
        guestsCanModify: false,
        guestsCanSeeOtherGuests: false,
        conferenceData: {
          createRequest: {
            // Idempotency key: a retry with the same id returns the same
            // conference instead of minting a second one.
            requestId: `nervaya-${input.kind}-${input.refId}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        extendedProperties: {
          private: buildEventTags(input.kind, input.refId, input.therapistId),
        },
      },
    })
    .catch(async (error: unknown) => {
      // 409 means this exact id already exists — i.e. a previous attempt DID
      // land and we are retrying. Adopt it instead of erroring or duplicating.
      const status = (error as { code?: number; status?: number }).code ?? (error as { status?: number }).status;
      if (status === 409) {
        return calendar.events.get({ calendarId: CALENDAR_ID, eventId });
      }
      throw error;
    });

  return {
    eventId: response.data.id ?? eventId,
    meetLink: extractMeetLink(response.data),
    startAt: window.startAt,
    endAt: window.endAt,
  };
}

/**
 * Moves an existing event.
 *
 * Patching start/end only — `conferenceData` is untouched, so THE MEET URL
 * SURVIVES. The previous delete-and-recreate silently invalidated every link
 * already sitting in the customer's inbox and WhatsApp history.
 */
export async function updateCalendarEvent(
  owner: CalendarOwner,
  eventId: string,
  input: CalendarEventInput,
): Promise<CalendarEventResult> {
  const window = computeEventWindow(input.date, input.startTime, input.durationMins);
  if (!window) throw new Error(`Unparseable session time: ${input.date} ${input.startTime}`);

  const calendar = getCalendarClientFor(owner.mailbox);

  const response = await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId,
    sendUpdates: 'all',
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: window.startAt.toISOString(), timeZone: IST_TIMEZONE },
      end: { dateTime: window.endAt.toISOString(), timeZone: IST_TIMEZONE },
    },
  });

  return {
    eventId: response.data.id ?? eventId,
    meetLink: extractMeetLink(response.data),
    startAt: window.startAt,
    endAt: window.endAt,
  };
}

/** Cancels an event. A 404/410 means it is already gone, which is success. */
export async function deleteCalendarEvent(owner: CalendarOwner, eventId: string): Promise<void> {
  const calendar = getCalendarClientFor(owner.mailbox);

  try {
    await calendar.events.delete({ calendarId: CALENDAR_ID, eventId, sendUpdates: 'all' });
  } catch (error) {
    const status = (error as { code?: number; status?: number }).code ?? (error as { status?: number }).status;
    if (status === 404 || status === 410) return;
    throw error;
  }
}

export interface ListCalendarEventsOptions {
  timeMin: Date;
  timeMax: Date;
  /**
   * `extendedProperties.private` filter, e.g. `nervayaTherapistId=<id>`.
   *
   * ⚠️ REQUIRED whenever the owner is a shared calendar. Omitting it there
   * returns every therapist's sessions to whoever asked.
   */
  privateExtendedProperty?: string | null;
  /** Hard cap on pagination, so one call cannot walk an entire calendar. */
  maxPages?: number;
}

/**
 * Deliberately NO syncToken support.
 *
 * Google forbids sending `privateExtendedProperty` together with a sync token,
 * and that filter is exactly what keeps one therapist from seeing another's
 * sessions on the shared calendar — so incremental sync and per-therapist
 * isolation are mutually exclusive here. Offering the parameter would imply a
 * capability this design cannot have.
 */

export interface ListCalendarEventsResult {
  events: calendar_v3.Schema$Event[];
}

export async function listCalendarEvents(
  owner: CalendarOwner,
  options: ListCalendarEventsOptions,
): Promise<ListCalendarEventsResult> {
  const calendar = getCalendarClientFor(owner.mailbox);

  const events: calendar_v3.Schema$Event[] = [];
  const maxPages = options.maxPages ?? 5;
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      singleEvents: true,
      maxResults: 250,
      pageToken,
      ...(options.privateExtendedProperty ? { privateExtendedProperty: [options.privateExtendedProperty] } : {}),
      timeMin: options.timeMin.toISOString(),
      timeMax: options.timeMax.toISOString(),
      showDeleted: false,
    });

    events.push(...(response.data.items ?? []));
    pageToken = response.data.nextPageToken ?? undefined;
    pages += 1;
  } while (pageToken && pages < maxPages);

  return { events };
}
