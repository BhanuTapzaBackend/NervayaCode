import type { OtpDelivery } from './otp-delivery.interface';
import { isWhatsAppConfigured, sendOtpTemplate } from '@/lib/whatsapp/whatsapp-client';

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
    async sendOtp(recipient: string, code: string): Promise<void> {
      await sendOtpTemplate(recipient, code);
    },
  };
}
