import { NextRequest, NextResponse } from 'next/server';
import { getDriftOffOrderById } from '@/lib/services/driftOffOrder.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const order = await getDriftOffOrderById(id);

    if (authResult.user.role !== ROLES.ADMIN && order.userId.toString() !== authResult.user.userId) {
      return NextResponse.json(errorResponse('Insufficient permissions', null, 403), { status: 403 });
    }

    return NextResponse.json(successResponse('Deep Rest order retrieved', order));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
