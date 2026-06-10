import { normalizePhone, validateOtpCode } from '@/lib/utils/validation.util';
import { checkOTPVerifyRateLimit } from '@/lib/utils/rate-limit.util';
import { verifyAndConsumeOtp, type OtpPurpose } from './otp-store';

export interface VerifyOtpResult {
  success: boolean;
  message?: string;
  statusCode: number;
}

export async function verifyOtp(
  phone: string,
  code: string,
  purpose: OtpPurpose,
  _ip: string,
): Promise<VerifyOtpResult> {
  const normalizedPhone = normalizePhone(phone);
  const sanitizedCode = code.trim();

  if (!normalizedPhone) {
    return { success: false, message: 'Invalid phone number', statusCode: 400 };
  }
  if (!validateOtpCode(sanitizedCode)) {
    return { success: false, message: 'Code must be 6 digits', statusCode: 400 };
  }
  if (purpose !== 'login' && purpose !== 'signup') {
    return { success: false, message: 'Invalid purpose', statusCode: 400 };
  }

  if (!(await checkOTPVerifyRateLimit(normalizedPhone))) {
    return {
      success: false,
      message: 'Too many verification attempts. Please try again later.',
      statusCode: 429,
    };
  }

  const valid = await verifyAndConsumeOtp(normalizedPhone, purpose, sanitizedCode);
  if (!valid) {
    return { success: false, message: 'Invalid or expired code', statusCode: 400 };
  }

  return { success: true, statusCode: 200 };
}
