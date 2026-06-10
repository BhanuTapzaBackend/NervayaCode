import type { OtpDelivery } from './otp-delivery.interface';

/**
 * Fallback delivery used when no real provider (WhatsApp) is configured.
 * Logs the code (development only) so OTP flows stay testable locally without
 * credentials. This runs server-side and never reaches the browser.
 */
export class ConsoleOtpDelivery implements OtpDelivery {
  async sendOtp(recipient: string, code: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[OTP] WhatsApp not configured — code for ${recipient}: ${code}`);
    }
  }
}
