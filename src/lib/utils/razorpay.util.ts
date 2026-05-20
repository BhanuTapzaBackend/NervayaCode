import Razorpay from 'razorpay';

export const getRazorpayInstance = (): Razorpay => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY Credentials must be defined');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

export async function initiateRefund(paymentId: string, amountInPaisa?: number): Promise<{ id: string }> {
  const razorpay = getRazorpayInstance();
  const refundOptions: { amount?: number } = {};
  if (amountInPaisa) refundOptions.amount = amountInPaisa;
  const refund = await razorpay.payments.refund(paymentId, refundOptions);
  return refund;
}
