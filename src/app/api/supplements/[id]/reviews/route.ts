import { NextRequest, NextResponse } from 'next/server';
import { getByProductId, create } from '@/lib/services/review.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));
    const result = await getByProductId(id, page, limit);
    return NextResponse.json(successResponse('Reviews fetched successfully', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { id } = await params;
    const body = await request.json();
    const rating = body?.rating;
    const comment = body?.comment;
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(errorResponse('Rating must be a number between 1 and 5', null, 400), { status: 400 });
    }
    await connectDB();
    let userDisplayName: string | undefined;
    const user = await User.findById(authResult.user.userId).select('name').lean();
    if (user?.name) {
      userDisplayName = user.name;
    }
    const review = await create(
      id,
      authResult.user.userId,
      rating,
      typeof comment === 'string' ? comment : undefined,
      userDisplayName,
    );
    return NextResponse.json(successResponse('Review submitted successfully', review));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
