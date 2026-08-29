import nodemailer from 'nodemailer';
import { getSessionConfirmationEmailContent } from '@/lib/email';
import { isNoSendTestEmail } from '@/lib/constants/test-logins';

interface SessionEmailProps {
  email: string;
  name: string;
  therapistName: string;
  date: string;
  startTime: string;
  meetLink: string;
}

export async function sendSessionConfirmationEmail(props: SessionEmailProps): Promise<void> {
  if (isNoSendTestEmail(props.email)) return;

  const user = process.env.OTP_EMAIL_USER;
  const appPassword = process.env.OTP_EMAIL_APP_PASSWORD;

  if (!user?.trim() || !appPassword?.trim()) {
    console.warn('Email credentials missing. Session confirmation email skipped.');
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
  const { html, text } = getSessionConfirmationEmailContent(props);

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: props.email,
      subject: `Session Confirmed with ${props.therapistName} - Nervaya`,
      text,
      html,
    });
  } catch (error) {
    console.error('Failed to send session confirmation email:', error);
  }
}
