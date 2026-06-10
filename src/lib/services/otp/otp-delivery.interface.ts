import type { OtpPurpose } from './otp-store';

export interface OtpDelivery {
  sendOtp(recipient: string, code: string, purpose: OtpPurpose): Promise<void>;
}
