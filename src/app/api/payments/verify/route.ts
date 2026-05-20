import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/services/payment.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { orderId, paymentId, razorpaySignature } = body;

    if (!orderId || !paymentId || !razorpaySignature) {
      return NextResponse.json(errorResponse('Order ID, payment ID, and signature are required', null, 400), {
        status: 400,
      });
    }

    const result = await verifyPayment(orderId, paymentId, razorpaySignature, authResult.user.userId);
    return NextResponse.json(successResponse('Payment verified successfully', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
