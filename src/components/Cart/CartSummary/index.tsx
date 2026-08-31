'use client';

import React from 'react';
import Link from 'next/link';
import { Cart } from '@/types/supplement.types';
import { ITEM_TYPE } from '@/lib/constants/enums';
import { Button } from '@/components/common';
import { formatPrice, getCartItemCount } from '@/utils/cart.util';
import { getShippingCost } from '@/utils/shipping.util';
import { trackViewCart, trackBeginCheckout } from '@/utils/analytics';
import styles from './styles.module.css';
import { cartItemsToGaItems } from '@/utils/ga-items.util';

interface CartSummaryProps {
  cart: Cart;
  onCheckout?: () => void;
  loading?: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({ cart, onCheckout, loading = false }) => {
  const itemCount = getCartItemCount(cart.items);
  const subtotal = cart.totalAmount;
  const isDigitalOnly = cart.items.every(
    (item) => item.itemType === ITEM_TYPE.DRIFT_OFF || item.itemType === ITEM_TYPE.THERAPY,
  );
  const shipping = isDigitalOnly ? 0 : getShippingCost(subtotal);
  const total = subtotal + shipping;

  React.useEffect(() => {
    trackViewCart({
      value: total,
      currency: 'INR',
      item_count: itemCount,
    });
  }, [total, itemCount]);

  return (
    <div className={styles.summary}>
      <h2 className={styles.title}>Order Summary</h2>
      <div className={styles.details}>
        <div className={styles.row}>
          <span>Items ({itemCount})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {!isDigitalOnly && (
          <>
            <div className={styles.row}>
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            {subtotal < 500 && (
              <div className={styles.freeShipping}>Add {formatPrice(500 - subtotal)} more for free shipping!</div>
            )}
          </>
        )}
        <div className={styles.divider}></div>
        <div className={`${styles.row} ${styles.totalRow}`}>
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
      <div className={styles.actions}>
        {cart.items.length > 0 ? (
          <Button
            variant="success"
            onClick={() => {
              trackBeginCheckout({
                value: total,
                currency: 'INR',
                item_count: itemCount,
                // Was hardcoded to 'supplements' for every row regardless of type.
                modules_in_cart: [...new Set(cart.items.map((item) => item.itemType))],
                items: cartItemsToGaItems(cart, '/cart'),
              });
              onCheckout?.();
            }}
            loading={loading}
            className={styles.checkoutButton}
          >
            Proceed to Checkout
          </Button>
        ) : (
          <Link href="/sleep-supplements" className={styles.shopLink}>
            <Button variant="primary" className={styles.checkoutButton}>
              Continue Shopping
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default CartSummary;
