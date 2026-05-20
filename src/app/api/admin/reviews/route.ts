import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { getAllReviews } from '@/lib/services/adminReview.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const filters: Record<string, unknown> = {};
    const rating = searchParams.get('rating');
    if (rating) filters.rating = parseInt(rating, 10);
    const isVisible = searchParams.get('isVisible');
    if (isVisible === 'true') filters.isVisible = true;
    if (isVisible === 'false') filters.isVisible = false;
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) filters.dateFrom = dateFrom;
    const dateTo = searchParams.get('dateTo');
    if (dateTo) filters.dateTo = dateTo;
    const search = searchParams.get('search');
    if (search) filters.search = search;
    const itemType = searchParams.get('itemType');
    if (itemType) filters.itemType = itemType;
    const responseId = searchParams.get('responseId');
    if (responseId) filters.responseId = responseId;

    const result = await getAllReviews(page, limit, filters);
    return NextResponse.json(successResponse('Reviews fetched', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
