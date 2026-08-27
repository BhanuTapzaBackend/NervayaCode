import type { OtpDelivery } from './otp-delivery.interface';
import { isWhatsAppConfigured, sendOtpTemplate } from '@/lib/whatsapp/whatsapp-client';
import { OTP_PURPOSE } from '@/lib/constants/enums';

/**
 * Human wording for the approved template's {{2}} variable.
 *
 * The purpose is interpolated verbatim into a message the customer reads. The
 * two original values happened to be English words, so `link_phone` would have
 * shipped as "Your Nervaya link_phone code is 482913" on the branch's main new
 * flow. Enum values are identifiers; they are not copy.
 */
const PURPOSE_TEXT: Record<string, string> = {
  [OTP_PURPOSE.LOGIN]: 'login',
  [OTP_PURPOSE.SIGNUP]: 'signup',
  [OTP_PURPOSE.LINK_PHONE]: 'verification',
};

/**
 * OTP delivery over the Meta WhatsApp Cloud API.
 * Returns null when WhatsApp credentials are absent so callers can fall back
 * to ConsoleOtpDelivery (mirrors createGmailOtpDelivery).
 */
export function createWhatsAppOtpDelivery(): OtpDelivery | null {
  if (!isWhatsAppConfigured()) {
    return null;
  }

  return {
    async sendOtp(recipient: string, code: string, purpose: string): Promise<void> {
      await sendOtpTemplate(recipient, code, PURPOSE_TEXT[purpose] ?? 'verification');
    },
  };
}
