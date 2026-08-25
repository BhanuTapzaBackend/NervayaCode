import { EMAIL_CONFIG } from '../constants';

export interface OrderConfirmationEmailProps {
  name: string;
  orderNumber: string;
  invoiceNumber: string;
  itemSummary: string;
  total: string;
  /** Rendered rows: name, qty, line total. */
  items: { name: string; quantity: number; lineTotal: string }[];
}

/**
 * Order confirmation email. Table-based and inline-styled — Gmail and Outlook
 * strip <style> blocks and don't support flex or grid.
 */
export function orderConfirmationEmail(props: OrderConfirmationEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Your Nervaya order ${props.orderNumber} is confirmed`;

  const rows = props.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;">
            ${item.name} <span style="color:#64748b;">× ${item.quantity}</span>
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;white-space:nowrap;">
            ${item.lineTotal}
          </td>
        </tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f5fa;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <tr><td style="padding:24px 28px;background:#4f31d9;">
      <span style="color:#ffffff;font-size:20px;font-weight:700;">${EMAIL_CONFIG.appName}</span>
    </td></tr>
    <tr><td style="padding:28px;">
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;">Hi ${props.name},</p>
      <p style="margin:0 0 20px;color:#334155;font-size:14px;line-height:1.6;">
        Thanks for your order. We've received your payment and your invoice
        (<strong>${props.invoiceNumber}</strong>) is attached to this email.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
        <tr><td colspan="2" style="padding-bottom:6px;color:#64748b;font-size:12px;letter-spacing:.06em;">
          ORDER ${props.orderNumber}
        </td></tr>
        ${rows}
        <tr>
          <td style="padding:14px 0 0;color:#0f172a;font-size:15px;font-weight:700;">Total</td>
          <td align="right" style="padding:14px 0 0;color:#4f31d9;font-size:17px;font-weight:700;white-space:nowrap;">
            ${props.total}
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
        We'll let you know as soon as your order ships. Questions? Just reply to this email.
      </p>
      <p style="margin:16px 0 0;color:#64748b;font-size:13px;">— Team ${EMAIL_CONFIG.appName}</p>
    </td></tr>
    <tr><td style="padding:16px 28px;background:#f8fafc;color:#94a3b8;font-size:11px;">
      ${EMAIL_CONFIG.appUrl}
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `Hi ${props.name},`,
    ``,
    `Thanks for your order. Your invoice (${props.invoiceNumber}) is attached.`,
    ``,
    `Order ${props.orderNumber}`,
    ...props.items.map((i) => `  ${i.name} x${i.quantity}  ${i.lineTotal}`),
    `  Total: ${props.total}`,
    ``,
    `We'll let you know as soon as your order ships.`,
    `— Team ${EMAIL_CONFIG.appName}`,
  ].join('\n');

  return { subject, html, text };
}
