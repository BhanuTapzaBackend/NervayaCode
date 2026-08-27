import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { ROLES } from '@/lib/constants/roles';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/user.model';
import { getTherapistDashboard } from '@/lib/services/therapistDashboard.service';

const MAX_RANGE_DAYS = 62;

/**
 * Everything the therapist dashboard renders, in one request.
 *
 * The therapist id comes from the SESSION, never a query parameter, so one
 * therapist cannot read another's schedule or client names.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, [ROLES.THERAPIST]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();

    const user = await User.findById(authResult.user.userId).select('therapistId').lean();
    if (!user?.therapistId) {
      return NextResponse.json(errorResponse('Therapist profile not linked to this account', null, 403), {
        status: 403,
      });
    }

    const params = request.nextUrl.searchParams;
    const start = params.get('start') ? new Date(params.get('start') as string) : new Date();
    const end = params.get('end') ? new Date(params.get('end') as string) : new Date(start.getTime() + 7 * 86_400_000);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return NextResponse.json(errorResponse('Invalid date range', null, 400), { status: 400 });
    }
    if ((end.getTime() - start.getTime()) / 86_400_000 > MAX_RANGE_DAYS) {
      return NextResponse.json(errorResponse(`Date range cannot exceed ${MAX_RANGE_DAYS} days`, null, 400), {
        status: 400,
      });
    }

    const data = await getTherapistDashboard(user.therapistId.toString(), { start, end });
    return NextResponse.json(successResponse('Dashboard fetched', data));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
