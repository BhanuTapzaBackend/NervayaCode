import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/constants/enums';
import type { BadgeProps } from '@/components/common/Badge';

export type StatusVariant = NonNullable<BadgeProps['variant']>;

/** Badge colour for an order's fulfilment status. Falls back to `neutral` for unknown values. */
export function orderStatusVariant(status?: string): StatusVariant {
  switch (status) {
    case ORDER_STATUS.DELIVERED:
      return 'success';
    case ORDER_STATUS.PENDING:
      return 'warning';
    case ORDER_STATUS.CANCELLED:
      return 'error';
    case ORDER_STATUS.CONFIRMED:
    case ORDER_STATUS.SHIPPED:
      return 'info';
    default:
      return 'neutral';
  }
}

/** Badge colour for an order's payment status. Falls back to `neutral` for unknown values. */
export function paymentStatusVariant(status?: string): StatusVariant {
  switch (status) {
    case PAYMENT_STATUS.PAID:
      return 'success';
    case PAYMENT_STATUS.PENDING:
      return 'warning';
    case PAYMENT_STATUS.FAILED:
    case PAYMENT_STATUS.REFUNDED:
      return 'error';
    default:
      return 'neutral';
  }
}

/** Short, human-readable order reference, e.g. `#A1B2C3D4`. */
export function formatOrderId(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`;
}
