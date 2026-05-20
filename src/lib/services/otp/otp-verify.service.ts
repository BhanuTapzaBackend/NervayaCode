import { validateEmail, validateOtpCode } from '@/lib/utils/validation.util';
import { checkOTPVerifyRateLimit } from '@/lib/utils/rate-limit.util';
import { verifyAndConsumeOtp, type OtpPurpose } from './otp-store';

export interface VerifyOtpResult {
  success: boolean;
  message?: string;
  statusCode: number;
}

export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose,
  _ip: string,
): Promise<VerifyOtpResult> {
  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedCode = code.trim();

  if (!sanitizedEmail) {
    return { success: false, message: 'Email is required', statusCode: 400 };
  }
  if (!validateEmail(sanitizedEmail)) {
    return { success: false, message: 'Invalid email format', statusCode: 400 };
  }
  if (!validateOtpCode(sanitizedCode)) {
    return { success: false, message: 'Code must be 6 digits', statusCode: 400 };
  }
  if (purpose !== 'login' && purpose !== 'signup') {
    return { success: false, message: 'Invalid purpose', statusCode: 400 };
  }

  if (!(await checkOTPVerifyRateLimit(sanitizedEmail))) {
    return {
      success: false,
      message: 'Too many verification attempts. Please try again later.',
      statusCode: 429,
    };
  }

  const valid = await verifyAndConsumeOtp(sanitizedEmail, purpose, sanitizedCode);
  if (!valid) {
    return { success: false, message: 'Invalid or expired code', statusCode: 400 };
  }

  return { success: true, statusCode: 200 };
}
