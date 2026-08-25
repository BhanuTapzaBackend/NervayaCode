import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { ApiError } from '@/types/error.types';
import { checkLoginRateLimit } from '@/lib/utils/rate-limit.util';
import { getClientIp } from '@/lib/utils/request.util';
import { otpSendErrorResponse } from '@/lib/utils/otp-response.util';
import { normalizePhone } from '@/lib/utils/validation.util';
import { getTestLogin } from '@/lib/constants/test-logins';
import { sendOtp } from '@/lib/services/otp';
import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(errorResponse('Phone is required', null, 400), { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json(errorResponse('Invalid phone number', null, 400), { status: 400 });
    }

    // Use IP+phone as composite key so each user gets their own rate-limit bucket.
    // Without this, all requests with no proxy (ip='unknown') share one bucket and
    // hit the attempt limit almost instantly, blocking everyone with a 429.
    const ip = getClientIp(request);
    const rateLimitKey = `${ip}:${normalizedPhone}`;

    // Test accounts are exempt: 5 logins per 15 min makes repeated manual
    // testing impossible, which defeats the point of the bypass.
    const isTestAccount = Boolean(getTestLogin(normalizedPhone));

    if (!isTestAccount && !(await checkLoginRateLimit(rateLimitKey))) {
      return NextResponse.json(errorResponse('Too many login attempts. Please try again later.', null, 429), {
        status: 429,
      });
    }

    await connectDB();
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      // Don't send an OTP to numbers without an account.
      return NextResponse.json(errorResponse('No account found. Please sign up.', { userExists: false }, 404), {
        status: 404,
      });
    }

    const otpResult = await sendOtp(normalizedPhone, 'login', ip);
    if (!otpResult.success) {
      return otpSendErrorResponse(otpResult);
    }

    return NextResponse.json(successResponse('OTP sent', { requireOtp: true, phone: normalizedPhone }, 200), {
      status: 200,
    });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error as ApiError);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
