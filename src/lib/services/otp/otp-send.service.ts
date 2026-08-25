import { normalizePhone } from '@/lib/utils/validation.util';
import { checkOTPSendLimit } from '@/lib/utils/rate-limit.util';
import { getTestLogin } from '@/lib/constants/test-logins';
import { generateOtpCode, saveOtp, type OtpPurpose } from './otp-store';
import type { OtpDelivery } from './otp-delivery.interface';
import { ConsoleOtpDelivery } from './console-otp-delivery';
import { createWhatsAppOtpDelivery } from './whatsapp-otp-delivery';
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
    const whatsapp = createWhatsAppOtpDelivery();
    defaultDelivery = whatsapp ?? new ConsoleOtpDelivery();
  }
  return defaultDelivery;
}

export async function sendOtp(
  phone: string,
  purpose: OtpPurpose,
  ip: string,
  delivery: OtpDelivery = getDefaultDelivery(),
): Promise<SendOtpResult> {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return {
      success: false,
      message: 'Invalid phone number',
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
    if (!(await hasPendingSignup(normalizedPhone))) {
      return {
        success: false,
        message: 'Signup session expired. Please sign up again.',
        statusCode: 400,
      };
    }
  }

  // Fixed test accounts: store their constant code and skip WhatsApp delivery
  // entirely, so repeated test logins never burn the send budget. See
  // src/lib/constants/test-logins.ts for the security caveats.
  const testLogin = getTestLogin(normalizedPhone);
  if (testLogin) {
    await saveOtp(normalizedPhone, purpose, testLogin.otp);
    return { success: true, statusCode: 200 };
  }

  const limitByPhone = await checkOTPSendLimit(normalizedPhone);
  if (!limitByPhone.allowed) {
    return {
      success: false,
      message: 'Too many OTP requests. Please try again later.',
      statusCode: 429,
      sendCount: limitByPhone.sendCount,
      resetTime: limitByPhone.resetTime,
    };
  }

  const code = generateOtpCode();
  await saveOtp(normalizedPhone, purpose, code);

  try {
    await delivery.sendOtp(normalizedPhone, code, purpose);
  } catch (error) {
    console.error('[OTP] WhatsApp delivery failed:', error);
    return {
      success: false,
      message: 'Could not send WhatsApp code. Please try again.',
      statusCode: 502,
    };
  }

  return {
    success: true,
    statusCode: 200,
  };
}
