import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { generateRange } from '@/lib/services/consultation-schedule.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;
const ALLOWED_SLOT_MINUTES = [15, 30, 45, 60];

/**
 * Auto-fill: bulk-generates slots across a date range.
 *
 * Shape is validated here; semantics (range size, window vs slot length,
 * weekday values) are validated in the service, which throws ValidationError.
 * Existing bookings are always preserved — re-running this never cancels anyone.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { fromDate, toDate, startTime, endTime, slotMinutes, weekdays } = body ?? {};

    if (!DATE_PATTERN.test(fromDate ?? '') || !DATE_PATTERN.test(toDate ?? '')) {
      return NextResponse.json(errorResponse('fromDate and toDate must be YYYY-MM-DD', null, 400), { status: 400 });
    }
    if (!TIME_PATTERN.test(startTime ?? '') || !TIME_PATTERN.test(endTime ?? '')) {
      return NextResponse.json(errorResponse('startTime and endTime must be HH:MM', null, 400), { status: 400 });
    }
    if (!ALLOWED_SLOT_MINUTES.includes(slotMinutes)) {
      return NextResponse.json(
        errorResponse(`slotMinutes must be one of ${ALLOWED_SLOT_MINUTES.join(', ')}`, null, 400),
        { status: 400 },
      );
    }
    if (!Array.isArray(weekdays) || weekdays.some((d) => typeof d !== 'number')) {
      return NextResponse.json(errorResponse('weekdays must be an array of numbers 0-6', null, 400), { status: 400 });
    }

    const result = await generateRange({ fromDate, toDate, startTime, endTime, slotMinutes, weekdays });

    const kept = result.bookingsPreserved > 0 ? `; kept ${result.bookingsPreserved} existing booking(s)` : '';
    return NextResponse.json(
      successResponse(`Generated ${result.slotsCreated} slots across ${result.datesGenerated} days${kept}`, result),
    );
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
