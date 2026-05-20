import nodemailer from 'nodemailer';
import { getWelcomeEmailContent } from '@/lib/email';

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const user = process.env.OTP_EMAIL_USER;
  const appPassword = process.env.OTP_EMAIL_APP_PASSWORD;

  if (!user?.trim() || !appPassword?.trim()) {
    return;
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
  const { html, text } = getWelcomeEmailContent({ name });

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: email,
      subject: 'Welcome to deeper sleep with Nervaya',
      text,
      html,
    });
  } catch {}
}
