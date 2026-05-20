import { CartItem } from '@/types/supplement.types';
import { CURRENCY } from '@/lib/constants/enums';

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const price = typeof item.price === 'number' ? item.price : 0;
    const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
    return total + price * quantity;
  }, 0);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: CURRENCY.CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function validateQuantity(quantity: number, min: number = 1, max?: number): boolean {
  if (quantity < min) {
    return false;
  }
  if (max !== undefined && quantity > max) {
    return false;
  }
  return true;
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((count, item) => {
    const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
    return count + quantity;
  }, 0);
}
