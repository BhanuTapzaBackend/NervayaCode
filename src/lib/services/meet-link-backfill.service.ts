import Session from '@/lib/models/session.model';
import Therapist from '@/lib/models/therapist.model';
import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';
import { MEET_STATUS, SESSION_STATUS } from '@/lib/constants/enums';
import { getMeetingProvider } from '@/lib/services/meeting-provider.service';
import { sendMeetLinkViaWhatsApp } from '@/lib/services/meet-link-whatsapp.service';
import { sendSessionConfirmationEmail } from '@/lib/services/email/session-confirmation.service';
import { toIstDateKey } from '@/lib/services/therapistDashboard.service';
import { isSlotInPast } from '@/lib/utils/sessionDateTime.util';

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
    // $in, never `$ne: 'ready'` — a negation also matches documents where the
    // field is ABSENT. Sessions predating meetStatus have no such field, so the
    // sweep would claim every legacy booking, "repair" it (instantly, under the
    // default jitsi provider) and send a duplicate confirmation email plus a
    // duplicate paid WhatsApp template to every existing customer.
    meetStatus: { $in: [MEET_STATUS.PENDING, MEET_STATUS.FAILED] },
    status: { $in: [SESSION_STATUS.PENDING, SESSION_STATUS.CONFIRMED] },
    date: { $gte: toIstDateKey(now) },
    // Exhausted rows are parked with a null next-attempt, so matching null here
    // would re-select them every run and — with a bounded batch — starve the
    // repairable ones out entirely. Only a due timestamp qualifies.
    meetNextAttemptAt: { $lte: now },
    meetAttempts: { $lt: MAX_ATTEMPTS },
  })
    // Oldest due first, so a stuck row cannot monopolise the batch.
    .sort({ meetNextAttemptAt: 1 })
    .limit(25)
    .lean();

  for (const candidate of candidates) {
    result.examined += 1;
    const sessionId = String(candidate._id);
    const attempts = candidate.meetAttempts ?? 0;

    // `date` is only day-granular, so today's already-finished sessions still
    // match the query above. Repairing one would email a join link for a
    // meeting that ended hours ago — and spend a paid WhatsApp template doing
    // it. Checked before the claim so it does not burn an attempt.
    if (isSlotInPast(candidate.date, candidate.startTime)) continue;

    // Claim BEFORE the external call. Two overlapping cron runs would otherwise
    // both create an event for the same session.
    //
    // `meetAttempts: attempts` cannot match a document where the field is
    // absent (0 does not match missing), which would skip those rows forever —
    // so match either form.
    const claimed = await Session.findOneAndUpdate(
      {
        _id: candidate._id,
        $or: [{ meetAttempts: attempts }, ...(attempts === 0 ? [{ meetAttempts: { $exists: false } }] : [])],
      },
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

    const meetingInput = {
      sessionId,
      therapistId: claimed.therapistId.toString(),
      date: claimed.date,
      startTime: claimed.startTime,
      durationMins: therapist?.sessionDurationMins,
      customerName: user?.name,
      customerEmail: user?.email,
      therapistName: therapist?.name,
    };

    // If an event already exists, MOVE it. Calling create would rebuild the
    // deterministic id, collide with 409, and silently adopt the existing event
    // AT ITS OLD TIME — then stamp the row ready and announce the new time,
    // leaving both calendars firing on the wrong slot. This is exactly the
    // state a failed reschedule hands us.
    const provider = getMeetingProvider();
    const { meetLink, externalEventId, status } = claimed.googleEventId
      ? await provider.updateMeeting(claimed.googleEventId, meetingInput)
      : await provider.createSessionMeeting(meetingInput);

    if (status !== MEET_STATUS.READY || !meetLink) {
      result.failed += 1;
      if (attempts + 1 >= MAX_ATTEMPTS) {
        // Park it: FAILED with no next attempt, so it drops out of the query
        // instead of being re-selected forever.
        await Session.updateOne({ _id: claimed._id }, { meetStatus: MEET_STATUS.FAILED, meetNextAttemptAt: null });
        result.exhausted += 1;
        console.error(`[meet-backfill] session ${sessionId} exhausted ${MAX_ATTEMPTS} attempts; needs a human`);
      }
      continue;
    }

    // Re-assert the status in the WRITE, not just the read.
    //
    // The provider call above takes seconds (it has its own retry ladder), and
    // the customer can cancel inside that window — `cancelSession` sets
    // `status: cancelled` but deliberately leaves `meetStatus` alone. An
    // unconditional write would then stamp the row ready and announce a join
    // link, by email and by paid WhatsApp template, for a session the customer
    // had just cancelled.
    const applied = await Session.updateOne(
      { _id: claimed._id, status: { $in: [SESSION_STATUS.PENDING, SESSION_STATUS.CONFIRMED] } },
      {
        meetLink,
        googleEventId: externalEventId ?? '',
        meetStatus: MEET_STATUS.READY,
        // Clear the budget too. It is otherwise only ever reset on the booking
        // path, so a session that needed 5 attempts once carried 5 into its
        // next incident (a failed reschedule) and got a single retry before
        // dropping out of the sweep permanently and silently.
        meetAttempts: 0,
        meetNextAttemptAt: null,
      },
    );
    if (applied.matchedCount === 0) continue;
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
