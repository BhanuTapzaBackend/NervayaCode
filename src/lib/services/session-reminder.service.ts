import connectDB from '@/lib/db/mongodb';
import Session from '@/lib/models/session.model';
import User from '@/lib/models/user.model';
import { SESSION_STATUS } from '@/lib/constants/enums';
import { sendSessionReminderViaWhatsApp } from '@/lib/services/meet-link-whatsapp.service';

// Sessions store wall-clock time in IST (Asia/Kolkata, +05:30).
const IST_OFFSET = '+05:30';
const REMINDER_WINDOW_MINUTES = 70; // remind once when the start is within the next ~70 min.

function istDateString(d: Date): string {
  // en-CA renders as YYYY-MM-DD, matching the Session.date format.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Convert a stored date ("YYYY-MM-DD") + time ("5:00 PM") into the absolute UTC instant. */
function toInstant(date: string, startTime: string): Date | null {
  const [time, period] = startTime.trim().split(' ');
  const [hStr, mStr] = (time || '').split(':');
  let hours = Number(hStr);
  const minutes = Number(mStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const upper = period?.toUpperCase();
  if (upper === 'PM' && hours !== 12) hours += 12;
  if (upper === 'AM' && hours === 12) hours = 0;

  const instant = new Date(
    `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00${IST_OFFSET}`,
  );
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/**
 * Finds confirmed/pending sessions starting within the next ~70 minutes that have not yet
 * been reminded, and sends each a WhatsApp reminder exactly once. Meant to be invoked by a
 * scheduled cron (every ~15 min). Idempotent via the Session.reminderSentAt guard.
 */
export async function sendDueSessionReminders(): Promise<{ sent: number; scanned: number }> {
  await connectDB();

  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60_000);

  // A session within ~70 min is "today" in IST, or "tomorrow" if we are near IST midnight.
  const candidateDates = [istDateString(now), istDateString(windowEnd)];

  const candidates = await Session.find({
    status: { $in: [SESSION_STATUS.CONFIRMED, SESSION_STATUS.PENDING] },
    reminderSentAt: null,
    date: { $in: candidateDates },
    meetLink: { $nin: [null, ''] },
  })
    .select('date startTime userId meetLink')
    .lean();

  let sent = 0;

  for (const session of candidates) {
    const instant = toInstant(session.date, session.startTime);
    if (!instant) continue;

    // Only sessions still in the future and within the reminder window.
    if (instant <= now || instant > windowEnd) continue;

    // Atomically claim the reminder so overlapping cron runs cannot double-send.
    const claimed = await Session.findOneAndUpdate(
      { _id: session._id, reminderSentAt: null },
      { reminderSentAt: now },
      { new: true },
    ).lean();
    if (!claimed) continue;

    const user = await User.findById(session.userId).select('name phone').lean();
    if (!user?.phone) continue;

    await sendSessionReminderViaWhatsApp({
      toE164: user.phone,
      name: user.name,
      date: session.date,
      time: session.startTime,
      meetLink: session.meetLink as string,
    });
    sent += 1;
  }

  return { sent, scanned: candidates.length };
}
