import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { replaceDay } from '@/lib/services/consultation-schedule.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import type { SlotTime } from '@/types/consultation.types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isSlotTime(value: unknown): value is SlotTime {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as SlotTime).startTime === 'string' &&
    typeof (value as SlotTime).endTime === 'string'
  );
}

/**
 * Replaces one day's slots (admin hand-edit).
 *
 * The service refuses to drop a slot that already has a booking, and rejects
 * duplicate, overlapping, or malformed times — so a bad edit is a clean 400.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  try {
    const authResult = await requireAuth(request, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { date } = await params;
    if (!DATE_PATTERN.test(date)) {
      return NextResponse.json(errorResponse('Date must be YYYY-MM-DD', null, 400), { status: 400 });
    }

    const body = await request.json();
    const slots: unknown = body?.slots;
    if (!Array.isArray(slots) || !slots.every(isSlotTime)) {
      return NextResponse.json(errorResponse('slots must be an array of { startTime, endTime }', null, 400), {
        status: 400,
      });
    }

    const updated = await replaceDay(date, slots);
    return NextResponse.json(successResponse('Day updated', updated));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
