import nodemailer from 'nodemailer';
import type { OtpDelivery } from './otp-delivery.interface';
import { getOtpEmailContent } from '@/lib/email';

export function createGmailOtpDelivery(): OtpDelivery | null {
  const user = process.env.OTP_EMAIL_USER;
  const appPassword = process.env.OTP_EMAIL_APP_PASSWORD;

  if (!user?.trim() || !appPassword?.trim()) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: user.trim(),
      pass: appPassword.trim(),
    },
  });

  const fromName = process.env.OTP_EMAIL_FROM_NAME?.trim() || 'Nervaya';

  return {
    async sendOtp(email: string, code: string): Promise<void> {
      const { html, text } = getOtpEmailContent({ code });

      await transporter.sendMail({
        from: `"${fromName}" <${user}>`,
        to: email,
        subject: 'Your verification code',
        text,
        html,
      });
    },
  };
}
