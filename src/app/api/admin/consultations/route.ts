import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { listConsultations } from '@/lib/services/consultation.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { PAGE_SIZE_10 } from '@/lib/constants/pagination.constants';

/** Paginated consultation bookings for the admin list. Filters: date range and status. */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get('page')) || 1);
    const limit = Math.max(1, Number(params.get('limit')) || PAGE_SIZE_10);

    const result = await listConsultations(page, limit, {
      status: params.get('status') ?? undefined,
      dateFrom: params.get('dateFrom') ?? undefined,
      dateTo: params.get('dateTo') ?? undefined,
    });

    return NextResponse.json(successResponse('Consultations retrieved', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
