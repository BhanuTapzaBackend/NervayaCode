import { NextRequest, NextResponse } from 'next/server';
import { verifyDriftOffPayment } from '@/lib/services/driftOffPayment.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { driftOffOrderId, paymentId, razorpaySignature } = body as {
      driftOffOrderId: string;
      paymentId: string;
      razorpaySignature: string;
    };

    if (!driftOffOrderId || !paymentId || !razorpaySignature) {
      return NextResponse.json(
        errorResponse('driftOffOrderId, paymentId and razorpaySignature are required', null, 400),
        { status: 400 },
      );
    }

    const result = await verifyDriftOffPayment(driftOffOrderId, paymentId, razorpaySignature, authResult.user.userId);

    return NextResponse.json(successResponse('Payment verified successfully', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
