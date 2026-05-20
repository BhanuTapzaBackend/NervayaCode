import { NextRequest, NextResponse } from 'next/server';
import { rescheduleSession } from '@/lib/services/session.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const { date, startTime } = await req.json();

    if (!date || !startTime) {
      return NextResponse.json(errorResponse('Date and startTime are required', null, 400), { status: 400 });
    }

    const session = await rescheduleSession(id, authResult.user.userId, date, startTime);

    return NextResponse.json(successResponse('Session rescheduled successfully', session));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
