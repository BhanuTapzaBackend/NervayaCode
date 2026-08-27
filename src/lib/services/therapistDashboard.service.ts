import { Types } from 'mongoose';

import Session from '@/lib/models/session.model';
import Therapist from '@/lib/models/therapist.model';
import connectDB from '@/lib/db/mongodb';
import { MEET_STATUS, SESSION_STATUS, type SessionStatus } from '@/lib/constants/enums';
import { getSlotInstant } from '@/lib/utils/sessionDateTime.util';

/**
 * Everything the therapist dashboard renders, in one round trip.
 *
 * Notably this POPULATES the client. `getSessionsByTherapistId` does not, which
 * is the entire reason the old dashboard printed a raw ObjectId as "Client ID".
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** The IST calendar day for an instant — matches how `Session.date` is stored. */
export function toIstDateKey(date: Date): string {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export interface TherapistSessionView {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  meetLink?: string;
  meetStatus?: string;
  /** Absolute instants, so the client never re-parses wall-clock strings. */
  startAt: string;
  endAt: string;
  /** "60 min" — the mockup shows a therapy type, but Session has no such field. */
  durationLabel: string;
  client: { _id: string; name: string } | null;
  /** First time this client has seen this therapist. Drives the "New Client" tag. */
  isNewClient: boolean;
}

export interface TherapistDashboardData {
  counts: { upcomingToday: number; completedToday: number; pending: number; cancelledToday: number };
  /** Sessions inside the requested range, for the calendar grid. */
  sessions: TherapistSessionView[];
  /** Next few upcoming, for the rail. */
  upcoming: TherapistSessionView[];
  pendingRequests: TherapistSessionView[];
  recentCompleted: TherapistSessionView[];
}

type LeanSession = {
  _id: unknown;
  userId: unknown;
  date: string;
  startTime: string;
  endTime?: string;
  status: SessionStatus;
  meetLink?: string;
  meetStatus?: string;
};

function minutesBetween(startAt: Date, endAt: Date): number {
  return Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 60_000));
}

function toView(session: LeanSession, durationMins: number, newClientIds: Set<string>): TherapistSessionView | null {
  const startAt = getSlotInstant(session.date, session.startTime);
  if (!startAt) return null;

  const endAt =
    getSlotInstant(session.date, session.endTime ?? '') ?? new Date(startAt.getTime() + durationMins * 60_000);

  // `.populate()` replaces userId with the doc when it resolves, and leaves the
  // raw ObjectId when the user was deleted — handle both.
  const populated = session.userId as { _id?: unknown; name?: string } | null;
  const clientId = populated?._id ? String(populated._id) : String(session.userId ?? '');
  const client = populated?.name ? { _id: clientId, name: populated.name } : null;

  return {
    _id: String(session._id),
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime ?? '',
    status: session.status,
    meetLink: session.meetLink || undefined,
    // `.lean()` does not apply schema defaults, so sessions predating the field
    // arrive undefined. They already hold whatever link they will ever get.
    meetStatus: session.meetStatus ?? MEET_STATUS.READY,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    durationLabel: `${minutesBetween(startAt, endAt)} min`,
    client,
    isNewClient: clientId ? newClientIds.has(clientId) : false,
  };
}

/** Clients whose only session with this therapist is the one in hand. */
async function findNewClientIds(therapistId: string): Promise<Set<string>> {
  const rows = await Session.collection
    .aggregate<{
      _id: unknown;
      n: number;
    }>([
      { $match: { therapistId: new Types.ObjectId(therapistId) } },
      { $group: { _id: '$userId', n: { $sum: 1 } } },
      { $match: { n: { $lte: 1 } } },
    ])
    .toArray();

  return new Set(rows.map((r) => String(r._id)));
}

export async function getTherapistDashboard(
  therapistId: string,
  range: { start: Date; end: Date },
): Promise<TherapistDashboardData> {
  await connectDB();

  const therapist = await Therapist.findById(therapistId).select('sessionDurationMins').lean();
  const durationMins = therapist?.sessionDurationMins || 60;

  const todayKey = toIstDateKey(new Date());
  const startKey = toIstDateKey(range.start);
  const endKey = toIstDateKey(range.end);

  const select = '_id userId date startTime endTime status meetLink meetStatus';
  const populate = { path: 'userId', select: 'name' };

  const [counts, rangeSessions, upcoming, pendingRequests, recentCompleted, newClientIds] = await Promise.all([
    Session.collection
      .aggregate<{
        _id: string;
        n: number;
      }>([
        { $match: { therapistId: new Types.ObjectId(therapistId), date: todayKey } },
        { $group: { _id: '$status', n: { $sum: 1 } } },
      ])
      .toArray(),

    Session.find({ therapistId, date: { $gte: startKey, $lte: endKey } })
      .select(select)
      .populate(populate)
      .sort({ date: 1, startTime: 1 })
      .lean(),

    Session.find({
      therapistId,
      date: { $gte: todayKey },
      status: { $in: [SESSION_STATUS.PENDING, SESSION_STATUS.CONFIRMED] },
    })
      .select(select)
      .populate(populate)
      .sort({ date: 1 })
      .limit(5)
      .lean(),

    Session.find({ therapistId, date: { $gte: todayKey }, status: SESSION_STATUS.PENDING })
      .select(select)
      .populate(populate)
      .sort({ date: 1 })
      .limit(5)
      .lean(),

    Session.find({ therapistId, status: SESSION_STATUS.COMPLETED })
      .select(select)
      .populate(populate)
      .sort({ date: -1 })
      .limit(5)
      .lean(),

    findNewClientIds(therapistId),
  ]);

  const countFor = (status: SessionStatus) => counts.find((c) => c._id === status)?.n ?? 0;

  // Sorting happens here, not on `startTime`, because that field is a 12-hour
  // string: a lexicographic sort puts "10:00 AM" before "9:00 AM".
  const build = (rows: unknown[]) =>
    (rows as LeanSession[])
      .map((row) => toView(row, durationMins, newClientIds))
      .filter((view): view is TherapistSessionView => view !== null)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));

  return {
    counts: {
      upcomingToday: countFor(SESSION_STATUS.PENDING) + countFor(SESSION_STATUS.CONFIRMED),
      completedToday: countFor(SESSION_STATUS.COMPLETED),
      pending: countFor(SESSION_STATUS.PENDING),
      cancelledToday: countFor(SESSION_STATUS.CANCELLED),
    },
    sessions: build(rangeSessions),
    upcoming: build(upcoming),
    pendingRequests: build(pendingRequests),
    recentCompleted: build(recentCompleted).reverse(),
  };
}
