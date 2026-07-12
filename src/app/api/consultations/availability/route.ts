import { NextRequest, NextResponse } from 'next/server';
import { getMonthAvailability, getPublicSlots } from '@/lib/services/consultation-schedule.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Availability for the public booking form.
 *
 * ?date=YYYY-MM     -> Record<date, freeSlotCount>, drives the calendar badges
 * ?date=YYYY-MM-DD  -> PublicSlot[], the slots offered on that day
 *
 * Both read the admin-managed schedule. A date the admin never opened simply
 * has no slots, rather than the fictional 9-6 grid this route used to invent.
 */
export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get('date');

    if (!date) {
      return NextResponse.json(errorResponse('A date (YYYY-MM or YYYY-MM-DD) is required', null, 400), {
        status: 400,
      });
    }

    if (DATE_PATTERN.test(date)) {
      const slots = await getPublicSlots(date);
      return NextResponse.json(successResponse('Slots retrieved', slots));
    }

    if (MONTH_PATTERN.test(date)) {
      const availability = await getMonthAvailability(date);
      return NextResponse.json(successResponse('Availability retrieved', availability));
    }

    return NextResponse.json(errorResponse('Date must be YYYY-MM or YYYY-MM-DD', null, 400), { status: 400 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
