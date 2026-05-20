import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { ApiError } from '@/types/error.types';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/user.model';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    await connectDB();
    const user = await User.findById(authResult.user.userId);
    if (!user) {
      return NextResponse.json(errorResponse('User not found', null, 401), { status: 401 });
    }

    return NextResponse.json(
      successResponse('Authenticated', {
        user: {
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          ...(user.therapistId && { therapistId: user.therapistId.toString() }),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      }),
      { status: 200 },
    );
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error as ApiError);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
