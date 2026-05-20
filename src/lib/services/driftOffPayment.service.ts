import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import mongoose, { Types } from 'mongoose';
import DriftOffOrder from '@/lib/models/driftOffOrder.model';
import { createDriftOffResponse } from '@/lib/services/driftOffResponse.service';
import { ValidationError, NotFoundError } from '@/lib/utils/error.util';
import { CURRENCY, PAYMENT_STATUS } from '@/lib/constants/enums';
import { getRazorpayInstance } from '@/lib/utils/razorpay.util';
import { toObjectId } from '@/lib/utils/objectId.util';

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

    return { verified: true, orderId: driftOffOrderId };
  } finally {
    await session.endSession();
  }
}
