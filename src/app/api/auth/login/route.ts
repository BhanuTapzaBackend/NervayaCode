import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/services/auth.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { ApiError } from '@/types/error.types';
import { COOKIE_NAMES, getSecureCookieOptions } from '@/utils/cookieConstants';
import { attemptGuestClaim } from '@/lib/services/guestSleepAssessment.service';
import { checkLoginRateLimit } from '@/lib/utils/rate-limit.util';

const REQUIRE_OTP = process.env.REQUIRE_OTP_FOR_LOGIN === 'true';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Use IP+email as composite key so each user gets their own rate-limit bucket.
    // Without this, all requests with no proxy (ip='unknown') share one bucket and
    // hit the 5-attempt limit almost instantly, blocking everyone with a 429.
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `${ip}:${typeof email === 'string' ? email.trim().toLowerCase() : 'unknown'}`;

    if (!(await checkLoginRateLimit(rateLimitKey))) {
      return NextResponse.json(errorResponse('Too many login attempts. Please try again later.', null, 429), {
        status: 429,
      });
    }

    if (!email || !password) {
      return NextResponse.json(errorResponse('Email and password are required', null, 400), { status: 400 });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(errorResponse('Invalid input format', null, 400), { status: 400 });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    if (!sanitizedEmail || !sanitizedPassword) {
      return NextResponse.json(errorResponse('Email and password cannot be empty', null, 400), { status: 400 });
    }

    const result = await loginUser(sanitizedEmail, sanitizedPassword);

    if (REQUIRE_OTP) {
      return NextResponse.json(successResponse('OTP required', { requireOtp: true, email: sanitizedEmail }, 200), {
        status: 200,
      });
    }

    const response = NextResponse.json(successResponse('Login successful', result), { status: 200 });
    response.cookies.set(COOKIE_NAMES.AUTH_TOKEN, result.token, getSecureCookieOptions());
    await attemptGuestClaim(request, response, result.user._id);
    return response;
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error as ApiError);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
