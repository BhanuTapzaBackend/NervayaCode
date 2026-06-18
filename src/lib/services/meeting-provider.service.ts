import { getRoomUrl } from './jitsi.service';
import { generateMeetLink, deleteMeeting as deleteGoogleEvent } from './googleCalendar.service';

/**
 * Pluggable meeting backend for therapy sessions. Switch backends with the
 * MEETING_PROVIDER env var ("jitsi" — default, embedded; or "google" — Google Meet).
 * Both produce a `meetLink` that every existing Join button already consumes.
 */
export interface SessionMeetingInput {
  sessionId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "5:00 PM"
  customerName?: string;
  therapistName?: string;
}

export interface MeetingResult {
  meetLink: string;
  /** Set by providers that create an external calendar event needing later cleanup (Google). */
  externalEventId?: string;
}

export interface MeetingProvider {
  readonly name: string;
  createSessionMeeting(input: SessionMeetingInput): Promise<MeetingResult>;
  deleteMeeting(externalEventId?: string): Promise<void>;
}

/** Jitsi (JaaS) — deterministic in-app embedded room. No external event to clean up. */
const jitsiProvider: MeetingProvider = {
  name: 'jitsi',
  async createSessionMeeting({ sessionId }) {
    return { meetLink: getRoomUrl(sessionId) };
  },
  async deleteMeeting() {
    // Rooms are created on-demand and disappear when empty; nothing to delete.
  },
};

/** Google Meet — generated via the Google Calendar API; the event id is kept for cleanup. */
const googleProvider: MeetingProvider = {
  name: 'google',
  async createSessionMeeting({ date, startTime, customerName, therapistName }) {
    const summary = `Therapy Session: ${customerName ?? 'Customer'} & ${therapistName ?? 'Therapist'}`;
    const description = `Your scheduled therapy session on Nervaya.\nCustomer: ${customerName ?? 'N/A'}\nTherapist: ${
      therapistName ?? 'N/A'
    }`;
    const { meetLink, eventId } = await generateMeetLink(date, startTime, summary, description);
    return { meetLink: meetLink ?? '', externalEventId: eventId ?? undefined };
  },
  async deleteMeeting(externalEventId) {
    if (externalEventId) await deleteGoogleEvent(externalEventId);
  },
};

/** Returns the active meeting provider (Jitsi unless MEETING_PROVIDER=google). */
export function getMeetingProvider(): MeetingProvider {
  return process.env.MEETING_PROVIDER?.trim().toLowerCase() === 'google' ? googleProvider : jitsiProvider;
}
