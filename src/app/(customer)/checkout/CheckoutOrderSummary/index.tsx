'use client';

import { Icon } from '@iconify/react';
import { ICON_RECEIPT, ICON_SHIELD } from '@/constants/icons';
import { formatPrice, getCartItemCount } from '@/utils/cart.util';
import { getShippingCost } from '@/utils/shipping.util';
import type { Cart } from '@/types/supplement.types';
import Button from '@/components/common/Button';
import styles from './styles.module.css';

interface CheckoutOrderSummaryProps {
  cart: Cart;
  isDigitalOnly?: boolean;
  promoDiscount?: number;
  onProceedToPayment: () => void;
  loading?: boolean;
  addressSelected?: boolean;
}

export function CheckoutOrderSummary({
  cart,
  isDigitalOnly = false,
  promoDiscount = 0,
  onProceedToPayment,
  loading = false,
  addressSelected = true,
}: CheckoutOrderSummaryProps) {
  const itemCount = getCartItemCount(cart.items);
  const subtotal = cart.totalAmount;
  const shipping = isDigitalOnly ? 0 : getShippingCost(subtotal);
  const total = Math.max(0, subtotal + shipping - promoDiscount);

  return (
    <div className={styles.summary}>
      <div className={styles.summaryHeader}>
        <span className={styles.summaryHeaderIcon} aria-hidden>
          <Icon icon={ICON_RECEIPT} />
        </span>
        <h2 className={styles.summaryTitle}>Order Summary</h2>
      </div>
      <div className={styles.summaryBody}>
        <div className={styles.summaryDetails}>
          <div className={styles.summaryRow}>
            <span>Number of products</span>
            <span>{itemCount}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {!isDigitalOnly && (
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span className={shipping === 0 ? styles.shipmentFree : undefined}>
                {shipping === 0 ? 'Free' : formatPrice(shipping)}
              </span>
            </div>
          )}
          {promoDiscount > 0 && (
            <div className={styles.summaryRow}>
              <span>Discount</span>
              <span className={styles.discount}>−{formatPrice(promoDiscount)}</span>
            </div>
          )}
          {!isDigitalOnly && subtotal < 500 && (
            <div className={styles.freeShipping}>
              Add {formatPrice(500 - subtotal)} more for free standard shipping!
            </div>
          )}
          <div className={styles.divider} />
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
        <div className={styles.actions}>
          {!isDigitalOnly && !addressSelected && (
            <p className={styles.addressHint}>Please enter your shipping address to proceed</p>
          )}
          <Button
            type="button"
            variant="success"
            onClick={onProceedToPayment}
            loading={loading}
            disabled={!isDigitalOnly && !addressSelected}
            className={styles.proceedButton}
          >
            Proceed to Payment
          </Button>
          <p className={styles.securityMessage}>
            <span className={styles.securityIcon} aria-hidden>
              <Icon icon={ICON_SHIELD} />
            </span>
            Your payment is secure
          </p>
        </div>
      </div>
    </div>
  );
}
