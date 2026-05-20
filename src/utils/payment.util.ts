import { randomBytes } from 'crypto';

export function formatAmountForRazorpay(amount: number): number {
  return Math.round(amount * 100);
}

export function formatAmountFromRazorpay(amount: number): number {
  return amount / 100;
}

export function generateOrderId(prefix: string = 'ORD'): string {
  const timestamp = Date.now();
  const random = randomBytes(2).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
}

export function validateRazorpayAmount(amount: number): boolean {
  return amount > 0 && amount <= 10000000;
}
