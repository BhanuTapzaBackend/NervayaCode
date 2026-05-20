import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import connectDB from '@/lib/db/mongodb';
import DriftOffResponse from '@/lib/models/driftOffResponse.model';

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(errorResponse('Order ID is required', null, 400), { status: 400 });
    }

    await connectDB();

    const response = await DriftOffResponse.findOne({
      driftOffOrderId: orderId,
      userId: authResult.user.userId,
    }).populate('driftOffOrderId');

    if (!response) {
      return NextResponse.json(errorResponse('No response found for this order', null, 404), { status: 404 });
    }

    return NextResponse.json(successResponse('Response retrieved successfully', response), { status: 200 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
