import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { ROLES } from '@/lib/constants/roles';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/user.model';
import { getTherapistCalendar } from '@/lib/services/google/therapist-calendar.service';

const MAX_RANGE_DAYS = 62;

/**
 * The signed-in therapist's calendar for a date range.
 *
 * A SEPARATE endpoint from `/api/therapists/[id]/schedule` on purpose: that
 * one's GET has no auth at all (deliberately — public booking needs to read
 * free slots), so merging private calendar entries into it would publish every
 * therapist's appointments to anyone holding a therapist id.
 *
 * The therapist id comes from the SESSION, never from a query parameter, so one
 * therapist cannot request another's calendar.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, [ROLES.THERAPIST]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();

    const user = await User.findById(authResult.user.userId).select('therapistId').lean();
    if (!user?.therapistId) {
      return NextResponse.json(errorResponse('Therapist profile not linked', null, 403), { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const startParam = params.get('start');
    const endParam = params.get('end');

    const start = startParam ? new Date(startParam) : new Date();
    const end = endParam ? new Date(endParam) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return NextResponse.json(errorResponse('Invalid date range', null, 400), { status: 400 });
    }

    // Bound the window: an unbounded range would page through the whole
    // calendar on every call and defeat the point of reading DB-first.
    const rangeDays = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    if (rangeDays > MAX_RANGE_DAYS) {
      return NextResponse.json(errorResponse(`Date range cannot exceed ${MAX_RANGE_DAYS} days`, null, 400), {
        status: 400,
      });
    }

    const result = await getTherapistCalendar(user.therapistId.toString(), start, end, {
      force: params.get('refresh') === '1',
    });

    return NextResponse.json(successResponse('Calendar fetched', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
