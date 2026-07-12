import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { getRange, getGeneratedThrough } from '@/lib/services/consultation-schedule.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Loads the schedule for a window, plus how far ahead availability exists (the runway banner). */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');

    if (!from || !to || !DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
      return NextResponse.json(errorResponse('from and to must be YYYY-MM-DD', null, 400), { status: 400 });
    }

    const [schedules, generatedThrough] = await Promise.all([getRange(from, to), getGeneratedThrough()]);
    return NextResponse.json(successResponse('Schedule retrieved', { schedules, generatedThrough }));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
