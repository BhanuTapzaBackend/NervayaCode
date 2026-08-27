import Session from '@/lib/models/session.model';
import Therapist from '@/lib/models/therapist.model';
import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';
import { MEET_STATUS, SESSION_STATUS } from '@/lib/constants/enums';
import { getMeetingProvider } from '@/lib/services/meeting-provider.service';
import { sendMeetLinkViaWhatsApp } from '@/lib/services/meet-link-whatsapp.service';
import { sendSessionConfirmationEmail } from '@/lib/services/email/session-confirmation.service';
import { toIstDateKey } from '@/lib/services/therapistDashboard.service';

/**
 * Repairs bookings whose meeting link could not be created at checkout.
 *
 * When the Calendar API is unreachable or rate-limited, `finalizeSessionBooking`
 * deliberately does not fail the booking — the customer has already paid. It
 * persists `meetStatus: 'pending'` and sends a link-less confirmation instead.
 * THIS is what finishes the job; without it a single transient 403 strands a
 * paid session with no meeting link, permanently.
 *
 * Idempotent: each session is claimed with a conditional update before any
 * external call, so overlapping runs cannot double-send.
 */

/** Give up after this many tries and leave it for a human. */
const MAX_ATTEMPTS = 6;

/** Exponential-ish backoff between attempts, in minutes. */
function nextDelayMinutes(attempt: number): number {
  return Math.min(60, 2 ** attempt);
}

export interface BackfillResult {
  examined: number;
  repaired: number;
  failed: number;
  exhausted: number;
}

export async function backfillPendingMeetLinks(): Promise<BackfillResult> {
  await connectDB();

  const now = new Date();
  const result: BackfillResult = { examined: 0, repaired: 0, failed: 0, exhausted: 0 };

  // Future sessions only — repairing a link for a session that already happened
  // helps nobody and would email the customer about a meeting they missed.
  const candidates = await Session.find({
    meetStatus: { $ne: MEET_STATUS.READY },
    status: { $in: [SESSION_STATUS.PENDING, SESSION_STATUS.CONFIRMED] },
    date: { $gte: toIstDateKey(now) },
    $or: [{ meetNextAttemptAt: null }, { meetNextAttemptAt: { $lte: now } }],
  })
    .limit(25)
    .lean();

  for (const candidate of candidates) {
    result.examined += 1;
    const sessionId = String(candidate._id);
    const attempts = candidate.meetAttempts ?? 0;

    if (attempts >= MAX_ATTEMPTS) {
      await Session.updateOne({ _id: candidate._id }, { meetStatus: MEET_STATUS.FAILED, meetNextAttemptAt: null });
      result.exhausted += 1;
      console.error(`[meet-backfill] session ${sessionId} exhausted ${MAX_ATTEMPTS} attempts; needs a human`);
      continue;
    }

    // Claim BEFORE the external call. Two overlapping cron runs would otherwise
    // both create an event for the same session.
    const claimed = await Session.findOneAndUpdate(
      { _id: candidate._id, meetAttempts: attempts },
      {
        meetAttempts: attempts + 1,
        meetNextAttemptAt: new Date(now.getTime() + nextDelayMinutes(attempts + 1) * 60_000),
      },
      { new: true },
    );
    if (!claimed) continue;

    const [user, therapist] = await Promise.all([
      User.findById(claimed.userId).select('email name phone').lean(),
      Therapist.findById(claimed.therapistId).select('name sessionDurationMins').lean(),
    ]);

    const { meetLink, externalEventId, status } = await getMeetingProvider().createSessionMeeting({
      sessionId,
      therapistId: claimed.therapistId.toString(),
      date: claimed.date,
      startTime: claimed.startTime,
      durationMins: therapist?.sessionDurationMins,
      customerName: user?.name,
      customerEmail: user?.email,
      therapistName: therapist?.name,
    });

    if (status !== MEET_STATUS.READY || !meetLink) {
      result.failed += 1;
      continue;
    }

    await Session.updateOne(
      { _id: claimed._id },
      {
        meetLink,
        googleEventId: externalEventId ?? '',
        meetStatus: MEET_STATUS.READY,
        meetNextAttemptAt: null,
      },
    );
    result.repaired += 1;

    // The original confirmation went out without a link, so deliver it now.
    // Both are fire-and-forget: the link is saved either way, and a notification
    // failure must not send this session back round the retry loop.
    if (user?.email) {
      await sendSessionConfirmationEmail({
        email: user.email,
        name: user.name,
        therapistName: therapist?.name || 'your Therapist',
        date: claimed.date,
        startTime: claimed.startTime,
        meetLink,
      }).catch(() => undefined);
    }
    if (user?.phone) {
      await sendMeetLinkViaWhatsApp({
        toE164: user.phone,
        name: user.name,
        date: claimed.date,
        time: claimed.startTime,
        meetLink,
      }).catch(() => undefined);
    }
  }

  return result;
}
