import { CartItem } from '@/types/supplement.types';
import { CURRENCY } from '@/lib/constants/enums';

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: CURRENCY.CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((count, item) => {
    const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
    return count + quantity;
  }, 0);
}
