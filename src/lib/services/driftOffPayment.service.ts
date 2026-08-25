import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import mongoose, { Types } from 'mongoose';
import DriftOffOrder from '@/lib/models/driftOffOrder.model';
import { createDriftOffResponse } from '@/lib/services/driftOffResponse.service';
import { ValidationError, NotFoundError } from '@/lib/utils/error.util';
import { CURRENCY, PAYMENT_STATUS } from '@/lib/constants/enums';
import { getRazorpayInstance } from '@/lib/utils/razorpay.util';
import { toObjectId } from '@/lib/utils/objectId.util';
import User from '@/lib/models/user.model';
import { hasPaymentBypass } from '@/lib/constants/test-logins';

export async function createDriftOffRazorpayOrder(driftOffOrderId: string) {
  await connectDB();

  if (!Types.ObjectId.isValid(driftOffOrderId)) {
    throw new ValidationError('Invalid Deep Rest Order ID');
  }

  const order = await DriftOffOrder.findById(driftOffOrderId);
  if (!order) {
    throw new NotFoundError('Deep Rest order not found');
  }

  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    throw new ValidationError('Order already paid');
  }

  // Fixed test customer: settle the Deep Rest order server-side and skip Razorpay.
  // See src/lib/constants/test-logins.ts for the security caveats.
  const buyer = await User.findById(order.userId).select('phone').lean();
  if (buyer?.phone && hasPaymentBypass(buyer.phone)) {
    const paymentId = `test_bypass_${driftOffOrderId.slice(-8)}`;
    await DriftOffOrder.findByIdAndUpdate(driftOffOrderId, { razorpayOrderId: paymentId });
    await settleDriftOffOrder(driftOffOrderId, paymentId, String(order.userId));
    return { bypassed: true as const, id: paymentId, orderId: driftOffOrderId };
  }

  const amountInPaisa = Math.round(order.amount * 100);

  const razorpay = getRazorpayInstance();
  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaisa,
    currency: CURRENCY.CODE,
    receipt: `receipt_${driftOffOrderId}`,
    notes: { driftOffOrderId: driftOffOrderId.toString() },
  });

  await DriftOffOrder.findByIdAndUpdate(driftOffOrderId, {
    razorpayOrderId: razorpayOrder.id,
  });

  return razorpayOrder;
}

export async function verifyDriftOffPayment(
  driftOffOrderId: string,
  paymentId: string,
  razorpaySignature: string,
  userId: string,
) {
  await connectDB();

  if (!Types.ObjectId.isValid(driftOffOrderId)) {
    throw new ValidationError('Invalid Deep Rest Order ID');
  }
  const order = await DriftOffOrder.findOne({ _id: driftOffOrderId, userId: toObjectId(userId) });
  if (!order) {
    throw new NotFoundError('Deep Rest order not found or access denied');
  }
  if (!order.razorpayOrderId) {
    throw new ValidationError('Razorpay order ID not found');
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  const text = `${order.razorpayOrderId}|${paymentId}`;
  const generated = crypto.createHmac('sha256', secret).update(text).digest('hex');

  if (generated !== razorpaySignature) {
    throw new ValidationError('Invalid payment signature');
  }

  await settleDriftOffOrder(driftOffOrderId, paymentId, userId);
  return { verified: true, orderId: driftOffOrderId };
}

/**
 * Marks a Deep Rest order paid and creates its response document, in one
 * transaction. Idempotent: a second call on an already-PAID order is a no-op.
 * Shared by the signature-verified path and the test-customer bypass.
 */
async function settleDriftOffOrder(driftOffOrderId: string, paymentId: string, userId: string): Promise<void> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const current = await DriftOffOrder.findById(driftOffOrderId).session(session);
      if (!current || current.paymentStatus === PAYMENT_STATUS.PAID) return;

      await DriftOffOrder.findByIdAndUpdate(driftOffOrderId, {
        paymentId,
        paymentStatus: PAYMENT_STATUS.PAID,
      }).session(session);

      await createDriftOffResponse(userId, driftOffOrderId, session);
    });
  } finally {
    await session.endSession();
  }
}
