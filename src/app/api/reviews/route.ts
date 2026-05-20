import { NextRequest, NextResponse } from 'next/server';
import { create } from '@/lib/services/review.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';

const VALID_ITEM_TYPES = ['Supplement', 'DriftOff', 'Therapy'];

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { productId, rating, comment, itemType = 'Supplement' } = body;

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(errorResponse('Product ID is required', null, 400), { status: 400 });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(errorResponse('Rating must be a number between 1 and 5', null, 400), { status: 400 });
    }
    if (!VALID_ITEM_TYPES.includes(itemType)) {
      return NextResponse.json(errorResponse('Invalid item type', null, 400), { status: 400 });
    }

    await connectDB();
    let userDisplayName: string | undefined;
    const user = await User.findById(authResult.user.userId).select('name').lean();
    if (user?.name) userDisplayName = user.name;

    const review = await create(
      productId,
      authResult.user.userId,
      rating,
      typeof comment === 'string' ? comment : undefined,
      userDisplayName,
      itemType,
    );

    return NextResponse.json(successResponse('Review submitted successfully', review));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
