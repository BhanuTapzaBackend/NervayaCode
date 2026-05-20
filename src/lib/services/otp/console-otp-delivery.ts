import type { OtpDelivery } from './otp-delivery.interface';

export class ConsoleOtpDelivery implements OtpDelivery {
  async sendOtp(_email: string, _code: string): Promise<void> {}
}
