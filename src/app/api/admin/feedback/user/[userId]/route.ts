import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { getFeedbackForUser } from '@/lib/services/adminFeedback.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(errorResponse('User ID is required', null, 400), { status: 400 });
    }

    const feedback = await getFeedbackForUser(userId);
    return NextResponse.json(successResponse('User feedback fetched', feedback));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
