import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { createDriftOffReview } from '@/lib/services/review.service';
import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER]);
    if (authResult instanceof NextResponse) return authResult;

    const { id: responseId } = await params;
    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || typeof rating !== 'number') {
      return NextResponse.json(errorResponse('Rating is required and must be a number', null, 400), { status: 400 });
    }

    await connectDB();
    const user = await User.findById(authResult.user.userId).select('name').lean();
    const displayName = user?.name || 'Anonymous';

    const review = await createDriftOffReview(
      responseId,
      authResult.user.userId,
      rating,
      typeof comment === 'string' ? comment : undefined,
      displayName,
    );

    return NextResponse.json(successResponse('Review submitted successfully', review), { status: 201 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
