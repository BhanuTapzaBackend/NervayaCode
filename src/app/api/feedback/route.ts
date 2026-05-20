import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { createFeedback } from '@/lib/services/feedback.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER]);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(errorResponse('Invalid request body', null, 400), { status: 400 });
    }

    const { score, comment, pageUrl } = body;

    if (score === undefined || score === null || typeof score !== 'number') {
      return NextResponse.json(errorResponse('Score is required and must be a number', null, 400), { status: 400 });
    }

    const feedback = await createFeedback({
      userId: authResult.user.userId,
      score,
      comment: typeof comment === 'string' ? comment : '',
      pageUrl: typeof pageUrl === 'string' ? pageUrl : '',
    });

    return NextResponse.json(successResponse('Feedback submitted successfully', feedback, 201), { status: 201 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
