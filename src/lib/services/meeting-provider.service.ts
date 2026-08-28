import Therapist from '@/lib/models/therapist.model';
import { CONSULTATION_MAILBOX } from '@/lib/constants/workspace.constants';
import { getRoomUrl } from './jitsi.service';
import { resolveCalendarOwner, type CalendarOwner } from './google/calendar-owner.service';
import { hasCalendarCredentials, classifyCalendarError } from './google/google-client.service';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './google/google-calendar-events.service';

/**
 * Pluggable meeting backend for therapy sessions. Switch with MEETING_PROVIDER
 * ("jitsi" — default, embedded; or "google" — Google Meet). Both produce a
 * `meetLink` that every existing Join button already consumes.
 */

export type MeetStatus = 'ready' | 'pending' | 'failed';

export interface SessionMeetingInput {
  sessionId: string;
  /** Required: decides whose calendar the event lands on. */
  therapistId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "5:00 PM"
  durationMins?: number;
  customerName?: string;
  customerEmail?: string | null;
  therapistName?: string;
}

export interface ConsultationMeetingInput {
  leadId: string;
  date: string;
  startTime: string;
  durationMins?: number;
  leadName?: string;
  leadEmail?: string | null;
}

export interface MeetingResult {
  meetLink: string;
  /** Set by providers that create an external calendar event needing later cleanup. */
  externalEventId?: string;
  status: MeetStatus;
  /** Populated when status is not 'ready', for logging and ops alerting. */
  errorCode?: string;
}

/**
 * Identifies whose calendar an event lives on, so it can be found again.
 *
 * Deleting or moving an event requires impersonating the SAME mailbox that owns
 * it — the previous `deleteMeeting(eventId)` signature could not express that
 * and could not have worked per-therapist.
 */
export interface MeetingOwnerRef {
  therapistId?: string;
  /** Set for consultations, which are pre-assignment and have no therapist. */
  isConsultation?: boolean;
}

export interface MeetingProvider {
  readonly name: string;
  createSessionMeeting(input: SessionMeetingInput): Promise<MeetingResult>;
  createConsultationMeeting(input: ConsultationMeetingInput): Promise<MeetingResult>;
  updateMeeting(externalEventId: string, input: SessionMeetingInput): Promise<MeetingResult>;
  deleteMeeting(externalEventId: string | undefined, owner?: MeetingOwnerRef): Promise<void>;
}

/** Jitsi (JaaS) — deterministic in-app embedded room. No external event to clean up. */
const jitsiProvider: MeetingProvider = {
  name: 'jitsi',
  async createSessionMeeting({ sessionId }) {
    return { meetLink: getRoomUrl(sessionId), status: 'ready' };
  },
  async createConsultationMeeting({ leadId }) {
    const { getConsultationRoomUrl } = await import('./jitsi.service');
    return { meetLink: getConsultationRoomUrl(leadId), status: 'ready' };
  },
  async updateMeeting(_externalEventId, { sessionId }) {
    // The room URL is derived from the session id, so it survives a reschedule.
    return { meetLink: getRoomUrl(sessionId), status: 'ready' };
  },
  async deleteMeeting() {
    // Rooms are created on-demand and disappear when empty; nothing to delete.
  },
};

/** Loads the calendar owner for a therapist, honouring the workspace fallback. */
async function ownerForTherapist(therapistId: string): Promise<{ owner: CalendarOwner; email?: string | null }> {
  const therapist = await Therapist.findById(therapistId).select('email sessionDurationMins').lean();
  return { owner: resolveCalendarOwner(therapist?.email), email: therapist?.email ?? null };
}

/**
 * Retries only what retrying can fix, with a hard cap.
 *
 * This runs inside a request path — and, for paid bookings, inside the
 * post-commit step of a checkout. Blocking a customer for 30 seconds to chase a
 * calendar API is worse than persisting `pending` and sweeping it up later.
 */
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  // Jittered, and long enough to actually clear a Google quota window — a
  // 150ms retry against a rate limit just spends another quota unit.
  const delays = [400, 1200];
  let lastError: unknown;

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (classifyCalendarError(error) !== 'retryable' || attempt === delays.length) throw error;
      await new Promise((resolve) => setTimeout(resolve, delays[attempt] + Math.floor(Math.random() * 250)));
    }
  }

  throw lastError;
}

/**
 * Never throws. A calendar failure must not undo a paid booking — it degrades
 * to `pending` so the retry cron can finish the job, and so the customer still
 * receives a confirmation (without a link) rather than silence.
 */
function toFailure(error: unknown, context: string): MeetingResult {
  const kind = classifyCalendarError(error);
  console.error(`[meeting-provider] ${context} failed (${kind}):`, error);
  return {
    meetLink: '',
    status: kind === 'fatal' ? 'failed' : 'pending',
    errorCode: kind,
  };
}

/** Google Meet, created on the owning calendar via a delegated service account. */
const googleProvider: MeetingProvider = {
  name: 'google',

  async createSessionMeeting(input) {
    if (!hasCalendarCredentials()) {
      return { meetLink: '', status: 'pending', errorCode: 'config' };
    }

    try {
      const { owner, email } = await ownerForTherapist(input.therapistId);

      // No client name in the title. In `oauth` mode this event sits on a
      // shared consumer mailbox with no admin controls, retention policy or
      // audit log — putting "who is in therapy with whom" in a calendar
      // subject line there is health-adjacent personal data we should not
      // be scattering. The attendee list already tells the participants who
      // they are meeting.
      const summary = `Nervaya session with ${input.therapistName ?? 'your therapist'}`;

      const result = await withRetry(() =>
        createCalendarEvent(owner, {
          kind: 'session',
          refId: input.sessionId,
          therapistId: input.therapistId,
          date: input.date,
          startTime: input.startTime,
          durationMins: input.durationMins,
          summary,
          description: 'Your scheduled therapy session on Nervaya.',
          therapistEmail: email,
          customerEmail: input.customerEmail,
        }),
      );

      return {
        meetLink: result.meetLink,
        externalEventId: result.eventId,
        status: result.meetLink ? 'ready' : 'pending',
      };
    } catch (error) {
      return toFailure(error, `createSessionMeeting(${input.sessionId})`);
    }
  },

  async createConsultationMeeting(input) {
    if (!hasCalendarCredentials()) {
      return { meetLink: '', status: 'pending', errorCode: 'config' };
    }

    try {
      // Consultations are pre-assignment: no therapist exists yet, so they live
      // on a dedicated ops mailbox rather than anyone's personal calendar.
      const owner = resolveCalendarOwner(CONSULTATION_MAILBOX);

      const result = await withRetry(() =>
        createCalendarEvent(owner, {
          kind: 'consultation',
          refId: input.leadId,
          date: input.date,
          startTime: input.startTime,
          durationMins: input.durationMins,
          summary: 'Nervaya consultation',
          description: 'Your free 1-on-1 consultation with Nervaya.',
          customerEmail: input.leadEmail,
        }),
      );

      return {
        meetLink: result.meetLink,
        externalEventId: result.eventId,
        status: result.meetLink ? 'ready' : 'pending',
      };
    } catch (error) {
      return toFailure(error, `createConsultationMeeting(${input.leadId})`);
    }
  },

  async updateMeeting(externalEventId, input) {
    if (!hasCalendarCredentials()) {
      return { meetLink: '', status: 'pending', errorCode: 'config' };
    }

    try {
      const { owner, email } = await ownerForTherapist(input.therapistId);
      const summary = `Nervaya session with ${input.therapistName ?? 'your therapist'}`;

      const result = await withRetry(() =>
        updateCalendarEvent(owner, externalEventId, {
          kind: 'session',
          refId: input.sessionId,
          therapistId: input.therapistId,
          date: input.date,
          startTime: input.startTime,
          durationMins: input.durationMins,
          summary,
          therapistEmail: email,
          customerEmail: input.customerEmail,
        }),
      );

      return {
        meetLink: result.meetLink,
        externalEventId: result.eventId,
        status: result.meetLink ? 'ready' : 'pending',
      };
    } catch (error) {
      // Recreate ONLY when the event is genuinely gone (the therapist deleted
      // it in Google). Recreating on a transient 401/403/5xx would mint a
      // second event and a NEW Meet URL while the old one stayed live and
      // joinable — silently pointing the customer's emailed link at the wrong
      // room, which is the exact failure patching exists to prevent.
      const status = (error as { code?: number; status?: number }).code ?? (error as { status?: number }).status;
      if (status === 404 || status === 410) {
        console.error(`[meeting-provider] event ${externalEventId} is gone; creating a replacement`);
        return googleProvider.createSessionMeeting(input);
      }
      return toFailure(error, `updateMeeting(${externalEventId})`);
    }
  },

  async deleteMeeting(externalEventId, ownerRef) {
    if (!externalEventId || !hasCalendarCredentials()) return;

    try {
      const owner = ownerRef?.isConsultation
        ? resolveCalendarOwner(CONSULTATION_MAILBOX)
        : ownerRef?.therapistId
          ? (await ownerForTherapist(ownerRef.therapistId)).owner
          : null;

      // Without an owner we cannot know which mailbox holds the event, and
      // guessing would either fail or delete the wrong calendar's entry.
      if (!owner) {
        console.error(`[meeting-provider] deleteMeeting(${externalEventId}) called without an owner ref`);
        return;
      }

      await deleteCalendarEvent(owner, externalEventId);
    } catch (error) {
      // Cleanup is best-effort: a cancelled session must still cancel.
      console.error(`[meeting-provider] deleteMeeting(${externalEventId}) failed:`, error);
    }
  },
};

/** Returns the active meeting provider (Jitsi unless MEETING_PROVIDER=google). */
export function getMeetingProvider(): MeetingProvider {
  return process.env.MEETING_PROVIDER?.trim().toLowerCase() === 'google' ? googleProvider : jitsiProvider;
}
