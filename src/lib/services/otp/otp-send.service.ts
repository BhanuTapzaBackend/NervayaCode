import { validateEmail } from '@/lib/utils/validation.util';
import { checkOTPSendLimit } from '@/lib/utils/rate-limit.util';
import { generateOtpCode, saveOtp, type OtpPurpose } from './otp-store';
import type { OtpDelivery } from './otp-delivery.interface';
import { ConsoleOtpDelivery } from './console-otp-delivery';
import { createGmailOtpDelivery } from './gmail-otp-delivery';
export interface SendOtpResult {
  success: boolean;
  message?: string;
  statusCode: number;
  sendCount?: number;
  resetTime?: number;
}

let defaultDelivery: OtpDelivery | null = null;

function getDefaultDelivery(): OtpDelivery {
  if (!defaultDelivery) {
    const gmail = createGmailOtpDelivery();
    defaultDelivery = gmail ?? new ConsoleOtpDelivery();
  }
  return defaultDelivery;
}

export async function sendOtp(
  email: string,
  purpose: OtpPurpose,
  ip: string,
  delivery: OtpDelivery = getDefaultDelivery(),
): Promise<SendOtpResult> {
  const sanitizedEmail = email.trim().toLowerCase();
  if (!sanitizedEmail) {
    return {
      success: false,
      message: 'Email is required',
      statusCode: 400,
    };
  }
  if (!validateEmail(sanitizedEmail)) {
    return {
      success: false,
      message: 'Invalid email format',
      statusCode: 400,
    };
  }
  if (purpose !== 'login' && purpose !== 'signup') {
    return {
      success: false,
      message: 'Invalid purpose',
      statusCode: 400,
    };
  }

  if (purpose === 'signup') {
    const { hasPendingSignup } = await import('@/lib/services/auth');
    if (!(await hasPendingSignup(sanitizedEmail))) {
      return {
        success: false,
        message: 'Signup session expired. Please sign up again.',
        statusCode: 400,
      };
    }
  }

  const limitByEmail = await checkOTPSendLimit(sanitizedEmail);
  if (!limitByEmail.allowed) {
    return {
      success: false,
      message: 'Too many OTP requests. Please try again later.',
      statusCode: 429,
      sendCount: limitByEmail.sendCount,
      resetTime: limitByEmail.resetTime,
    };
  }

  const code = generateOtpCode();
  await saveOtp(sanitizedEmail, purpose, code);

  await delivery.sendOtp(sanitizedEmail, code);

  return {
    success: true,
    statusCode: 200,
  };
}
