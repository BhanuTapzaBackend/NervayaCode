import { NextRequest, NextResponse } from 'next/server';
import Session from '@/lib/models/session.model';
import User from '@/lib/models/user.model';
import {
  createCustomSlot,
  updateSlot,
  deleteSlot,
  getScheduleByDate,
  getSchedulesByDateRange,
} from '@/lib/services/therapistSchedule.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { canModifyBookedSlot } from '@/lib/utils/slotGuard.util';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface SessionBooking {
  _id: string;
  date: string;
  startTime: string;
  status: string;
  meetLink?: string;
}

interface BookingInfo {
  sessionId: string;
  status: string;
  meetLink: string;
}

function buildBookedMap(sessions: SessionBooking[]): Map<string, Map<string, BookingInfo>> {
  const map = new Map<string, Map<string, BookingInfo>>();
  for (const s of sessions) {
    const dateKey = s.date as string;
    if (!map.has(dateKey)) map.set(dateKey, new Map());
    const dateMap = map.get(dateKey);
    if (dateMap)
      dateMap.set(s.startTime as string, {
        sessionId: s._id.toString(),
        status: s.status as string,
        meetLink: (s.meetLink as string) || '',
      });
  }
  return map;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: therapistId } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeBooked = searchParams.get('includeBooked') !== 'false';

    if (startDate && endDate) {
      const schedules = await getSchedulesByDateRange(therapistId, startDate, endDate, includeBooked);
      const bookedSessions = await Session.find({
        therapistId,
        date: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' },
      })
        .select('date startTime status meetLink')
        .lean();

      const bookedMap = buildBookedMap(bookedSessions as unknown as SessionBooking[]);

      const data = schedules.map((s) => ({
        date: s.date,
        slots: s.slots.map((slot) => {
          const booking = bookedMap.get(s.date)?.get(slot.startTime);
          const isBooked = !!booking;
          return {
            startTime: slot.startTime,
            endTime: slot.endTime,
            isAvailable: isBooked ? false : slot.isAvailable,
            isCustomized: slot.isCustomized || false,
            ...(isBooked
              ? { sessionId: booking.sessionId, sessionStatus: booking.status, meetLink: booking.meetLink }
              : {}),
          };
        }),
      }));
      return NextResponse.json(successResponse('Schedules fetched successfully', data));
    }

    if (date) {
      const schedule = await getScheduleByDate(therapistId, date);
      const bookedSessions = await Session.find({
        therapistId,
        date,
        status: { $ne: 'cancelled' },
      })
        .select('date startTime status meetLink')
        .lean();

      const bookedMap = buildBookedMap(bookedSessions as unknown as SessionBooking[]);

      const slots = (schedule.slots || []).map((slot) => {
        const booking = bookedMap.get(date)?.get(slot.startTime);
        const isBooked = !!booking;
        return {
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: isBooked ? false : slot.isAvailable,
          isCustomized: slot.isCustomized || false,
          ...(isBooked ? { sessionId: booking.sessionId, sessionStatus: booking.status } : {}),
        };
      });

      return NextResponse.json(
        successResponse('Schedule fetched successfully', {
          date: schedule.date || date,
          slots,
        }),
      );
    }

    return NextResponse.json(errorResponse('Date or startDate/endDate is required', null, 400), { status: 400 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

async function verifyTherapistOwnership(userId: string, therapistId: string): Promise<boolean> {
  const user = await User.findById(userId).select('therapistId').lean();
  return user?.therapistId?.toString() === therapistId;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN, ROLES.THERAPIST]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: therapistId } = await params;

    if (authResult.user.role === ROLES.THERAPIST) {
      const isOwner = await verifyTherapistOwnership(authResult.user.userId, therapistId);
      if (!isOwner) {
        return NextResponse.json(errorResponse('You can only manage your own schedule', null, 403), { status: 403 });
      }
    }

    const body = await req.json();
    const { date, startTime, endTime, isAvailable } = body;

    if (!date || !startTime || !endTime) {
      return NextResponse.json(errorResponse('Missing required fields: date, startTime, endTime', null, 400), {
        status: 400,
      });
    }

    const slot = await createCustomSlot(
      therapistId,
      date,
      startTime,
      endTime,
      isAvailable !== undefined ? isAvailable : true,
    );

    return NextResponse.json(successResponse('Slot created successfully', slot, 201), { status: 201 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN, ROLES.THERAPIST]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: therapistId } = await params;

    if (authResult.user.role === ROLES.THERAPIST) {
      const isOwner = await verifyTherapistOwnership(authResult.user.userId, therapistId);
      if (!isOwner) {
        return NextResponse.json(errorResponse('You can only manage your own schedule', null, 403), { status: 403 });
      }
    }

    const body = await req.json();
    const { date, startTime, updates } = body;

    if (!date || !startTime || !updates) {
      return NextResponse.json(errorResponse('Missing required fields: date, startTime, updates', null, 400), {
        status: 400,
      });
    }

    // 48-hour rule for therapists on booked slots
    if (authResult.user.role === ROLES.THERAPIST) {
      const session = await Session.findOne({
        therapistId,
        date,
        startTime,
        status: { $ne: 'cancelled' },
      }).lean();

      if (session && !canModifyBookedSlot(date, startTime)) {
        return NextResponse.json(
          errorResponse('Cannot modify booked slots within 48 hours of the session', null, 403),
          { status: 403 },
        );
      }
    }

    const slot = await updateSlot(therapistId, date, startTime, updates);

    return NextResponse.json(successResponse('Slot updated successfully', slot));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN, ROLES.THERAPIST]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: therapistId } = await params;

    if (authResult.user.role === ROLES.THERAPIST) {
      const isOwner = await verifyTherapistOwnership(authResult.user.userId, therapistId);
      if (!isOwner) {
        return NextResponse.json(errorResponse('You can only manage your own schedule', null, 403), { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const startTime = searchParams.get('startTime');

    if (!date || !startTime) {
      return NextResponse.json(errorResponse('Missing required parameters: date, startTime', null, 400), {
        status: 400,
      });
    }

    // 48-hour rule for therapists on booked slots
    if (authResult.user.role === ROLES.THERAPIST) {
      const session = await Session.findOne({
        therapistId,
        date,
        startTime,
        status: { $ne: 'cancelled' },
      }).lean();

      if (session && !canModifyBookedSlot(date, startTime)) {
        return NextResponse.json(
          errorResponse('Cannot modify booked slots within 48 hours of the session', null, 403),
          { status: 403 },
        );
      }
    }

    await deleteSlot(therapistId, date, startTime);

    return NextResponse.json(successResponse('Slot deleted successfully'));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
