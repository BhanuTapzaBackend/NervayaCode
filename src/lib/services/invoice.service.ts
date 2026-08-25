import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order.model';
import User from '@/lib/models/user.model';
import { nextSequence } from '@/lib/models/counter.model';
import { uploadMedia } from '@/lib/services/cloudinary.service';
import { buildInvoicePdf, type InvoiceData, type InvoiceLine } from '@/lib/pdf/invoice-pdf';
import { ITEM_TYPE } from '@/lib/constants/enums';
import { toObjectId } from '@/lib/utils/objectId.util';

export interface PreparedInvoice {
  invoiceNumber: string;
  /** Cloudinary URL — WhatsApp needs a public link for a document header. */
  invoiceUrl: string;
  pdf: Buffer;
  data: InvoiceData;
}

/**
 * Indian financial year label for a date: April–March, e.g. `2026-27`.
 * Invoice sequences reset each year, which is the convention businesses and
 * accountants expect.
 */
export function financialYear(date: Date): string {
  const year = date.getFullYear();
  const startYear = date.getMonth() >= 3 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

/** Allocates the next invoice number, e.g. `NRV/2026-27/0042`. */
export async function allocateInvoiceNumber(issuedAt: Date): Promise<string> {
  const fy = financialYear(issuedAt);
  const seq = await nextSequence(`invoice:${fy}`);
  return `NRV/${fy}/${String(seq).padStart(4, '0')}`;
}

function describeItem(itemType: string, metadata?: Record<string, unknown>): string | undefined {
  if (itemType === ITEM_TYPE.THERAPY) {
    const date = typeof metadata?.date === 'string' ? metadata.date : undefined;
    const slot = typeof metadata?.slot === 'string' ? metadata.slot : undefined;
    return date && slot ? `Therapy session · ${date} at ${slot}` : 'Therapy session';
  }
  if (itemType === ITEM_TYPE.DRIFT_OFF) return 'Deep Rest · digital programme';
  return 'Supplement';
}

/**
 * True when the order is nothing but therapy sessions.
 *
 * Those get no invoice: booking already sends its own confirmation carrying the
 * meeting link, so an invoice would be a second, duplicate message. A mixed cart
 * still gets one — the customer bought supplements too — and the therapy line
 * appears on it so the totals reconcile.
 */
function isTherapyOnly(items: { itemType: string }[]): boolean {
  return items.length > 0 && items.every((item) => item.itemType === ITEM_TYPE.THERAPY);
}

/**
 * Builds (and stores) the invoice for a paid order. Returns null when the order
 * is missing or is therapy-only.
 *
 * Idempotent on the invoice number: an order that already has one keeps it, so
 * a retry never burns a second number or renumbers a document the customer has.
 */
export async function prepareInvoiceForOrder(orderId: string): Promise<PreparedInvoice | null> {
  await connectDB();

  const order = await Order.findById(orderId).lean();
  if (!order) return null;

  // Checked before allocating a number, so skipped orders leave no gap in the
  // invoice sequence.
  if (isTherapyOnly(order.items)) return null;

  const issuedAt = new Date(order.createdAt ?? Date.now());
  const invoiceNumber = order.invoiceNumber ?? (await allocateInvoiceNumber(issuedAt));

  const user = await User.findById(toObjectId(String(order.userId)))
    .select('name email phone')
    .lean();

  const lines: InvoiceLine[] = order.items.map((item) => ({
    name: item.name,
    description: describeItem(item.itemType, item.metadata as Record<string, unknown> | undefined),
    quantity: item.quantity,
    unitPrice: item.price,
  }));

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const promoDiscount = order.promoDiscount ?? 0;
  const address = order.shippingAddress;

  const data: InvoiceData = {
    invoiceNumber,
    orderNumber: `#${String(order._id).slice(-8).toUpperCase()}`,
    issuedAt,
    paymentStatus: order.paymentStatus,
    paymentReference: order.paymentId,
    customer: {
      name: address?.name || user?.name || 'Customer',
      phone: address?.phone || user?.phone,
      email: user?.email ?? undefined,
      addressLines: address
        ? [
            address.addressLine1,
            address.addressLine2,
            `${address.city}, ${address.state} ${address.zipCode}`,
            address.country,
          ].filter((line): line is string => Boolean(line))
        : undefined,
    },
    lines,
    promoCode: order.promoCode,
    promoDiscount,
    // Whatever the line items and promo don't account for is shipping/handling.
    extras: order.totalAmount - (subtotal - promoDiscount),
    total: order.totalAmount,
  };

  const pdf = await buildInvoicePdf(data);
  const invoiceUrl = await uploadMedia(pdf);

  await Order.findByIdAndUpdate(orderId, { invoiceNumber, invoiceUrl });

  return { invoiceNumber, invoiceUrl, pdf, data };
}
