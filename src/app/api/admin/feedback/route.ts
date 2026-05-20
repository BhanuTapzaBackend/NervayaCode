import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { getAllFeedback, getFeedbackByUser, getFeedbackStats } from '@/lib/services/adminFeedback.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const filters: Record<string, unknown> = {};
    const minScore = searchParams.get('minScore');
    if (minScore) filters.minScore = parseInt(minScore, 10);
    const maxScore = searchParams.get('maxScore');
    if (maxScore) filters.maxScore = parseInt(maxScore, 10);
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) filters.dateFrom = dateFrom;
    const dateTo = searchParams.get('dateTo');
    if (dateTo) filters.dateTo = dateTo;
    const search = searchParams.get('search');
    if (search) filters.search = search;

    if (view === 'stats') {
      const stats = await getFeedbackStats();
      return NextResponse.json(successResponse('Feedback stats fetched', stats));
    }

    if (view === 'grouped') {
      const result = await getFeedbackByUser(page, limit, filters);
      return NextResponse.json(successResponse('Feedback grouped by user fetched', result));
    }

    const result = await getAllFeedback(page, limit, filters);
    return NextResponse.json(successResponse('Feedback fetched', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
