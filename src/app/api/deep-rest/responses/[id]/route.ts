import { NextRequest, NextResponse } from 'next/server';
import { getDriftOffResponseById } from '@/lib/services/driftOffResponse.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const response = await getDriftOffResponseById(id);

    if (authResult.user.role !== ROLES.ADMIN && response.userId.toString() !== authResult.user.userId) {
      return NextResponse.json(errorResponse('Insufficient permissions', null, 403), { status: 403 });
    }

    return NextResponse.json(successResponse('Deep Rest response retrieved', response));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
