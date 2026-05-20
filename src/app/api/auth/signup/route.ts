import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { ApiError } from '@/types/error.types';
import { checkSignupRateLimit } from '@/lib/utils/rate-limit.util';
import { validateEmail, validatePassword, validateName } from '@/lib/utils/validation.util';
import { savePendingSignup, clearPendingSignup } from '@/lib/services/auth';
import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';
import { ROLES, Role } from '@/lib/constants/roles';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (!(await checkSignupRateLimit(ip))) {
      return NextResponse.json(errorResponse('Too many signup attempts. Please try again later.', null, 429), {
        status: 429,
      });
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json(errorResponse('Email, password, and name are required', null, 400), { status: 400 });
    }

    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      return NextResponse.json(errorResponse('Invalid input format', null, 400), { status: 400 });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();
    const sanitizedName = name.trim();

    if (!sanitizedEmail || !sanitizedPassword || !sanitizedName) {
      return NextResponse.json(errorResponse('Email, password, and name cannot be empty', null, 400), { status: 400 });
    }

    if (!validateEmail(sanitizedEmail)) {
      return NextResponse.json(errorResponse('Invalid email format', null, 400), { status: 400 });
    }

    const passwordValidation = validatePassword(sanitizedPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(errorResponse(passwordValidation.message || 'Invalid password', null, 400), {
        status: 400,
      });
    }

    if (!validateName(sanitizedName)) {
      return NextResponse.json(errorResponse('Name must be at least 2 characters long', null, 400), {
        status: 400,
      });
    }

    await connectDB();
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return NextResponse.json(errorResponse('User with this email already exists', null, 400), { status: 400 });
    }

    const sanitizedRole: Role | undefined = role === 'ADMIN' ? ROLES.CUSTOMER : (role as Role | undefined);

    await clearPendingSignup(sanitizedEmail);
    await savePendingSignup(sanitizedEmail, sanitizedPassword, sanitizedName, sanitizedRole);

    const { sendOtp } = await import('@/lib/services/otp/otp-send.service');
    const otpResult = await sendOtp(sanitizedEmail, 'signup', ip);

    if (!otpResult.success) {
      return NextResponse.json(errorResponse(otpResult.message || 'Failed to send OTP', null, otpResult.statusCode), {
        status: otpResult.statusCode,
      });
    }

    return NextResponse.json(successResponse('Verify your email', { requireOtp: true, email: sanitizedEmail }, 201), {
      status: 201,
    });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error as ApiError);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
