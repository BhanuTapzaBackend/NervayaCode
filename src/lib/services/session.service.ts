import Session, { ISession } from '@/lib/models/session.model';
import { bookSlot, releaseSlot } from '@/lib/services/therapistSchedule.service';
import connectDB from '@/lib/db/mongodb';
import { ValidationError } from '@/lib/utils/error.util';
import mongoose, { Types } from 'mongoose';
import { SESSION_STATUS, SessionStatus } from '@/lib/constants/enums';
import User from '@/lib/models/user.model';
import Therapist from '@/lib/models/therapist.model';
import { generateMeetLink, deleteMeeting } from './googleCalendar.service';
import { sendSessionConfirmationEmail } from './email/session-confirmation.service';
import { toObjectId } from '@/lib/utils/objectId.util';

export async function createSession(
  userId: string,
  therapistId: string,
  date: string,
  startTime: string,
  mongooseSession?: mongoose.ClientSession,
) {
  await connectDB();

  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(therapistId)) {
    throw new ValidationError('Invalid User ID or Therapist ID');
  }

  const startHour = parseInt(startTime.split(':')[0]);
  const isPM = startTime.includes('PM');
  const hour24 = isPM && startHour !== 12 ? startHour + 12 : !isPM && startHour === 12 ? 0 : startHour;
  const nextHour24 = (hour24 + 1) % 24;
  const displayHour = nextHour24 === 0 ? 12 : nextHour24 > 12 ? nextHour24 - 12 : nextHour24;
  const endTime = `${displayHour}:00 ${nextHour24 >= 12 ? 'PM' : 'AM'}`;

  // When called from payment.service (with mongooseSession), run inside the existing transaction.
  // When called standalone, create our own transaction for atomicity.
  const needsOwnTransaction = !mongooseSession;
  const txnSession = mongooseSession || (await mongoose.startSession());

  let createdSession: ISession | undefined;
  try {
    const executeAtomicCreation = async () => {
      // Check inside the transaction to prevent race conditions.
      // The partial unique index on (therapistId, date, startTime) where status != cancelled
      // acts as a safety net, but we check first for a better error message.
      const existingSession = await Session.findOne({
        therapistId,
        date,
        startTime,
        status: { $ne: SESSION_STATUS.CANCELLED },
      }).session(txnSession);

      if (existingSession) {
        throw new ValidationError('Slot is already booked');
      }

      const sessionRes = await Session.create(
        [
          {
            userId: toObjectId(userId),
            therapistId: new Types.ObjectId(therapistId),
            date,
            startTime,
            endTime,
            status: SESSION_STATUS.PENDING,
          },
        ],
        { session: txnSession },
      );
      createdSession = Array.isArray(sessionRes) ? sessionRes[0] : sessionRes;

      await bookSlot(therapistId, date, startTime, createdSession._id.toString(), txnSession);
    };

    if (needsOwnTransaction) {
      await txnSession.withTransaction(executeAtomicCreation);
    } else {
      await executeAtomicCreation();
    }
  } catch (error) {
    // Handle duplicate key error from the partial unique index (concurrent booking race)
    if (error instanceof Error && 'code' in error && (error as { code: number }).code === 11000) {
      throw new ValidationError('Slot is already booked');
    }
    throw error;
  } finally {
    if (needsOwnTransaction) {
      await txnSession.endSession();
    }
  }

  if (!createdSession) {
    throw new ValidationError('Failed to create session');
  }

  // --- Google Meet & Email Integration (awaited inline) ---
  try {
    const [user, therapist] = await Promise.all([
      User.findById(userId).select('email name'),
      Therapist.findById(therapistId).select('name email'),
    ]);

    if (user) {
      const { meetLink, eventId } = await generateMeetLink(
        date,
        startTime,
        `Therapy Session: ${user.name} & ${therapist?.name || 'Therapist'}`,
        `Your scheduled therapy session on Nervaya.\nCustomer: ${user.name}\nTherapist: ${therapist?.name || 'N/A'}`,
      );

      if (meetLink) {
        await Session.findByIdAndUpdate(createdSession._id, { meetLink, googleEventId: eventId });
        createdSession.meetLink = meetLink;
        createdSession.googleEventId = eventId ?? undefined;
      }

      if (user.email) {
        await sendSessionConfirmationEmail({
          email: user.email,
          name: user.name,
          therapistName: therapist?.name || 'your Therapist',
          date,
          startTime,
          meetLink: meetLink || '',
        });
      }
    }
  } catch (integrationError) {
    console.error('Error in post-booking integration:', integrationError);
  }

  return createdSession;
}

export async function cancelSession(sessionId: string, userId: string) {
  await connectDB();

  const session = await Session.findById(sessionId);
  if (!session) throw new ValidationError('Session not found');
  if (session.userId.toString() !== userId) throw new ValidationError('Unauthorized');

  // Allow cancelling PENDING or CONFIRMED sessions
  if (session.status !== SESSION_STATUS.PENDING && session.status !== SESSION_STATUS.CONFIRMED) {
    throw new ValidationError('Only pending or confirmed sessions can be cancelled');
  }

  const oldEventId = session.googleEventId;
  session.status = SESSION_STATUS.CANCELLED;
  await session.save();

  await releaseSlot(session.therapistId.toString(), session.date, session.startTime);

  if (oldEventId) {
    await deleteMeeting(oldEventId);
  }

  return session;
}

export async function rescheduleSession(sessionId: string, userId: string, newDate: string, newStartTime: string) {
  await connectDB();

  const session = await Session.findById(sessionId);
  if (!session) throw new ValidationError('Session not found');
  if (session.userId.toString() !== userId) throw new ValidationError('Unauthorized');

  if (session.status !== SESSION_STATUS.PENDING && session.status !== SESSION_STATUS.CONFIRMED) {
    throw new ValidationError('Only pending or confirmed sessions can be rescheduled');
  }

  const oldDate = session.date;
  const oldStartTime = session.startTime;
  const oldEventId = session.googleEventId;

  // 1. Compute new end time
  const startHour = parseInt(newStartTime.split(':')[0]);
  const isPM = newStartTime.includes('PM');
  const hour24 = isPM && startHour !== 12 ? startHour + 12 : !isPM && startHour === 12 ? 0 : startHour;
  const newNextHour24 = (hour24 + 1) % 24;
  const newDisplayHour = newNextHour24 === 0 ? 12 : newNextHour24 > 12 ? newNextHour24 - 12 : newNextHour24;
  const newEndTime = `${newDisplayHour}:00 ${newNextHour24 >= 12 ? 'PM' : 'AM'}`;

  // 2. Atomically update the session and re-mark slots in a transaction
  const txnSession = await mongoose.startSession();
  try {
    await txnSession.withTransaction(async () => {
      session.date = newDate;
      session.startTime = newStartTime;
      session.endTime = newEndTime;
      await session.save({ session: txnSession });

      await releaseSlot(session.therapistId.toString(), oldDate, oldStartTime, txnSession);
      await bookSlot(session.therapistId.toString(), newDate, newStartTime, session._id.toString(), txnSession);
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code: number }).code === 11000) {
      throw new ValidationError('The new slot is already booked');
    }
    throw error;
  } finally {
    await txnSession.endSession();
  }

  // 4. Update Google Calendar (awaited inline)
  try {
    if (oldEventId) await deleteMeeting(oldEventId);

    const [user, therapist] = await Promise.all([
      User.findById(userId).select('email name'),
      Therapist.findById(session.therapistId).select('name'),
    ]);

    if (user) {
      const { meetLink, eventId } = await generateMeetLink(
        newDate,
        newStartTime,
        `Rescheduled: ${user.name} & ${therapist?.name || 'Therapist'}`,
        `Your rescheduled therapy session on Nervaya.\nCustomer: ${user.name}\nTherapist: ${therapist?.name || 'N/A'}`,
      );

      await Session.findByIdAndUpdate(session._id, { meetLink, googleEventId: eventId });
      session.meetLink = meetLink ?? undefined;
      session.googleEventId = eventId ?? undefined;

      if (user.email) {
        await sendSessionConfirmationEmail({
          email: user.email,
          name: user.name,
          therapistName: therapist?.name || 'your Therapist',
          date: newDate,
          startTime: newStartTime,
          meetLink: meetLink || '',
        });
      }
    }
  } catch (err) {
    console.error('Error updating Google Meet during reschedule:', err);
  }

  return session;
}

export async function updateSessionStatus(sessionId: string, status: SessionStatus) {
  await connectDB();

  const session = await Session.findById(sessionId);
  if (!session) throw new ValidationError('Session not found');

  const VALID_TRANSITIONS: Record<string, string[]> = {
    [SESSION_STATUS.PENDING]: [SESSION_STATUS.CONFIRMED, SESSION_STATUS.CANCELLED],
    [SESSION_STATUS.CONFIRMED]: [SESSION_STATUS.COMPLETED, SESSION_STATUS.CANCELLED],
    [SESSION_STATUS.COMPLETED]: [],
    [SESSION_STATUS.CANCELLED]: [],
  };

  if (!VALID_TRANSITIONS[session.status]?.includes(status)) {
    throw new ValidationError(`Cannot move from ${session.status} to ${status}`);
  }

  const oldEventId = session.googleEventId;
  session.status = status;
  await session.save();

  if (status === SESSION_STATUS.CANCELLED) {
    await releaseSlot(session.therapistId.toString(), session.date, session.startTime);
    if (oldEventId) await deleteMeeting(oldEventId);
  }

  return session;
}

// Keep existing query functions
export async function getAllSessions(
  page: number = 1,
  limit: number = 10,
  filters?:
    | {
        status?: string;
        search?: string;
        therapistId?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    | string,
) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (typeof filters === 'string') {
    if (filters) filter.status = filters;
  } else if (filters) {
    if (filters.status) filter.status = filters.status;
    if (filters.therapistId) filter.therapistId = new Types.ObjectId(filters.therapistId);
    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, string> = {};
      if (filters.dateFrom) dateFilter.$gte = filters.dateFrom;
      if (filters.dateTo) dateFilter.$lte = filters.dateTo;
      filter.date = dateFilter;
    }
    if (filters.search && filters.search.trim()) {
      const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      })
        .select('_id')
        .lean();
      filter.userId = { $in: matchingUsers.map((u) => u._id) };
    }
  }
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Session.find(filter)
      .populate('therapistId')
      .populate('userId', 'name email')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Session.countDocuments(filter),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUserSessions(userId: string, statusFilter?: string) {
  await connectDB();
  const filter: Record<string, unknown> = { userId: toObjectId(userId) };
  if (statusFilter) filter.status = statusFilter;
  return Session.find(filter).populate('therapistId').sort({ date: -1, startTime: -1 }).limit(200).lean();
}

export async function getSessionById(sessionId: string) {
  await connectDB();
  return Session.findById(sessionId).populate('therapistId').lean();
}

export async function getSessionsByTherapistId(therapistId: string, statusFilter?: string) {
  await connectDB();
  const filter: Record<string, unknown> = {
    therapistId: new Types.ObjectId(therapistId),
  };
  if (statusFilter) filter.status = statusFilter;
  return Session.find(filter).sort({ date: -1, startTime: -1 }).limit(200).lean();
}
