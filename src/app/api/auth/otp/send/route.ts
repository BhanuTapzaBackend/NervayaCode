import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { sendOtp } from '@/lib/services/otp';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  const body = await request.json().catch(() => ({}));
  const { email, purpose } = body;

  if (!email || !purpose) {
    return NextResponse.json(errorResponse('Email and purpose are required', null, 400), { status: 400 });
  }

  if (typeof email !== 'string' || typeof purpose !== 'string') {
    return NextResponse.json(errorResponse('Invalid input format', null, 400), { status: 400 });
  }

  if (purpose !== 'login' && purpose !== 'signup') {
    return NextResponse.json(errorResponse('Purpose must be login or signup', null, 400), { status: 400 });
  }

  const result = await sendOtp(email, purpose, ip);

  if (!result.success) {
    const body = {
      ...errorResponse(result.message ?? 'Failed to send OTP', null, result.statusCode),
      ...(result.sendCount !== undefined && {
        data: { otpSendCount: result.sendCount },
      }),
    };
    return NextResponse.json(body, { status: result.statusCode });
  }

  return NextResponse.json(successResponse('OTP sent successfully', undefined, 200), { status: 200 });
}
