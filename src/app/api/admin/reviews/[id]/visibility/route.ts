import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { toggleReviewVisibility } from '@/lib/services/adminReview.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const review = await toggleReviewVisibility(id);
    return NextResponse.json(successResponse('Review visibility toggled', review));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
