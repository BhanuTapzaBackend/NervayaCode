import { NextRequest, NextResponse } from 'next/server';
import {
  createDriftOffResponse,
  getDriftOffResponsesByUser,
  saveAnswer,
} from '@/lib/services/driftOffResponse.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));

    const result = await getDriftOffResponsesByUser(authResult.user.userId, page, limit);
    return NextResponse.json(successResponse('Deep Rest responses retrieved', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { driftOffOrderId, questionId, answer } = body as {
      driftOffOrderId: string;
      questionId?: string;
      answer?: string | string[];
    };

    if (!driftOffOrderId) {
      return NextResponse.json(errorResponse('driftOffOrderId is required', null, 400), { status: 400 });
    }

    if (questionId !== undefined && answer !== undefined) {
      const updated = await saveAnswer(authResult.user.userId, driftOffOrderId, {
        questionId,
        answer,
      });
      return NextResponse.json(successResponse('Answer saved', updated));
    }

    const response = await createDriftOffResponse(authResult.user.userId, driftOffOrderId);
    return NextResponse.json(successResponse('Deep Rest response created', response, 201), {
      status: 201,
    });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
