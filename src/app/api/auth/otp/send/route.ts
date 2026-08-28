import { isPublicOtpPurpose } from '@/lib/constants/enums';
import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { getClientIp } from '@/lib/utils/request.util';
import { otpSendErrorResponse } from '@/lib/utils/otp-response.util';
import { sendOtp } from '@/lib/services/otp';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const body = await request.json().catch(() => ({}));
  const { phone, purpose } = body;

  if (!phone || !purpose) {
    return NextResponse.json(errorResponse('Phone and purpose are required', null, 400), { status: 400 });
  }

  if (typeof phone !== 'string' || typeof purpose !== 'string') {
    return NextResponse.json(errorResponse('Invalid input format', null, 400), { status: 400 });
  }

  // Explicitly narrow to the PUBLIC purposes. 'link_phone' attaches a number
  // to an existing account and must only ever be reachable through the
  // requireAuth'd /api/auth/phone/* routes — this endpoint has no session.
  if (!isPublicOtpPurpose(purpose)) {
    return NextResponse.json(errorResponse('Purpose must be login or signup', null, 400), { status: 400 });
  }

  const result = await sendOtp(phone, purpose, ip);

  if (!result.success) {
    return otpSendErrorResponse(result);
  }

  return NextResponse.json(successResponse('OTP sent successfully', undefined, 200), { status: 200 });
}
