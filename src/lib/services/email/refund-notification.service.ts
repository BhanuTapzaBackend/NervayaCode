import nodemailer from 'nodemailer';

interface RefundEmailProps {
  email: string;
  name: string;
  orderId: string;
  amount: number;
  reason: string;
}

export async function sendRefundNotificationEmail(props: RefundEmailProps): Promise<void> {
  const user = process.env.OTP_EMAIL_USER;
  const appPassword = process.env.OTP_EMAIL_APP_PASSWORD;

  if (!user?.trim() || !appPassword?.trim()) {
    console.warn('Email credentials missing. Refund notification email skipped.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: user.trim(), pass: appPassword.trim() },
  });

  const fromName = process.env.OTP_EMAIL_FROM_NAME?.trim() || 'Nervaya';
  const text = `Hi ${props.name},\n\nYour order (${props.orderId}) has been refunded.\nAmount: ₹${props.amount}\nReason: ${props.reason}\n\nThe refund will reflect in your account within 5-7 business days.\n\nTeam Nervaya`;
  const html = `<p>Hi ${props.name},</p><p>Your order (<strong>${props.orderId}</strong>) has been refunded.</p><p><strong>Amount:</strong> ₹${props.amount}<br/><strong>Reason:</strong> ${props.reason}</p><p>The refund will reflect in your account within 5-7 business days.</p><p>Team Nervaya</p>`;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: props.email,
      subject: `Refund Processed for Order ${props.orderId} - Nervaya`,
      text,
      html,
    });
  } catch (error) {
    console.error('Failed to send refund notification email:', error);
  }
}
