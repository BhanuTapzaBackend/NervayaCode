import nodemailer from 'nodemailer';
import { prepareInvoiceForOrder } from '@/lib/services/invoice.service';
import { sendDocumentTemplate } from '@/lib/whatsapp/whatsapp-client';
import { WHATSAPP_TEMPLATES } from '@/lib/constants/whatsapp-templates';
import { orderConfirmationEmail } from '@/lib/email/templates/order-confirmation';
import type { InvoiceData } from '@/lib/pdf/invoice-pdf';

/** `₹1,887` — no decimals; the PDF carries the exact figures. */
function money(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function moneyExact(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "Magnesium Glycinate +2 more" — WhatsApp body variables must stay short. */
function itemSummary(data: InvoiceData): string {
  const first = data.lines[0]?.name ?? 'your order';
  const rest = data.lines.length - 1;
  return rest > 0 ? `${first} +${rest} more` : first;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || 'there';
}

async function sendWhatsApp(data: InvoiceData, invoiceUrl: string): Promise<void> {
  const phone = data.customer.phone;
  if (!phone) return;

  const template = WHATSAPP_TEMPLATES.ORDER_CONFIRMATION;
  await sendDocumentTemplate(
    phone,
    template.name,
    template.language,
    [firstName(data.customer.name), data.orderNumber, itemSummary(data), money(data.total)],
    { link: invoiceUrl, filename: `${data.invoiceNumber.replace(/\//g, '-')}.pdf` },
  );
}

async function sendEmail(data: InvoiceData, pdf: Buffer): Promise<void> {
  const to = data.customer.email;
  if (!to) return;

  const user = process.env.OTP_EMAIL_USER?.trim();
  const appPassword = process.env.OTP_EMAIL_APP_PASSWORD?.trim();
  if (!user || !appPassword) return;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass: appPassword },
  });

  const { subject, html, text } = orderConfirmationEmail({
    name: firstName(data.customer.name),
    orderNumber: data.orderNumber,
    invoiceNumber: data.invoiceNumber,
    itemSummary: itemSummary(data),
    total: moneyExact(data.total),
    items: data.lines.map((line) => ({
      name: line.name,
      quantity: line.quantity,
      lineTotal: moneyExact(line.unitPrice * line.quantity),
    })),
  });

  await transporter.sendMail({
    from: `"${process.env.OTP_EMAIL_FROM_NAME?.trim() || 'Nervaya'}" <${user}>`,
    to,
    subject,
    text,
    html,
    attachments: [
      { filename: `${data.invoiceNumber.replace(/\//g, '-')}.pdf`, content: pdf, contentType: 'application/pdf' },
    ],
  });
}

/**
 * Generates the invoice and sends the confirmation over WhatsApp (always — phone
 * is the primary identifier) and email (only when the account has one).
 *
 * MUST be called AFTER the payment transaction commits: it does external I/O
 * (PDF upload, WhatsApp, SMTP) that must never be held open inside a
 * transaction. Each channel fails independently — an SMTP outage must not stop
 * the WhatsApp message, and neither must ever fail the order.
 */
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  const prepared = await prepareInvoiceForOrder(orderId);
  if (!prepared) return;

  const { data, pdf, invoiceUrl } = prepared;

  const results = await Promise.allSettled([sendWhatsApp(data, invoiceUrl), sendEmail(data, pdf)]);
  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') {
      console.error(`[order-confirmation] ${index === 0 ? 'WhatsApp' : 'email'} failed for ${orderId}:`, result.reason);
    }
  }
}
