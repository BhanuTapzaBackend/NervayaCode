import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { updateConsultationStatus } from '@/lib/services/consultation.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

const ALLOWED_STATUSES = ['confirmed', 'cancelled'] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

function isAllowedStatus(value: unknown): value is AllowedStatus {
  return typeof value === 'string' && (ALLOWED_STATUSES as readonly string[]).includes(value);
}

/** Confirms or cancels a booking. Cancelling releases the slot back into the pool. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();

    if (!isAllowedStatus(body?.status)) {
      return NextResponse.json(errorResponse('status must be "confirmed" or "cancelled"', null, 400), { status: 400 });
    }

    const updated = await updateConsultationStatus(id, body.status);
    return NextResponse.json(successResponse(`Consultation ${body.status}`, updated));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
