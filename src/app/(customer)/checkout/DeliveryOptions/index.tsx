'use client';

import { Icon } from '@iconify/react';
import { ICON_BOX } from '@/constants/icons';
import { formatPrice } from '@/utils/cart.util';
import { getShippingCost } from '@/utils/shipping.util';
import styles from './styles.module.css';

interface DeliveryOptionsProps {
  subtotal: number;
}

export function DeliveryOptions({ subtotal }: DeliveryOptionsProps) {
  const cost = getShippingCost(subtotal);
  const isFree = cost === 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.headerIcon} aria-hidden>
          <Icon icon={ICON_BOX} />
        </span>
        <h3 className={styles.headerTitle}>Delivery</h3>
      </div>
      <ul className={styles.body} aria-label="Delivery options">
        <li>
          <label className={`${styles.option} ${styles.optionSelected}`}>
            <input
              type="radio"
              name="deliveryMethod"
              value="standard"
              checked
              readOnly
              className={styles.radio}
              aria-label={`Standard Delivery, 5-7 business days, ${isFree ? 'Free' : formatPrice(cost)}`}
            />
            <div className={styles.optionContent}>
              <span className={styles.optionLabel}>Standard Delivery</span>
              <span className={styles.optionDuration}>5-7 business days</span>
            </div>
            <span className={isFree ? styles.optionFree : styles.optionCost}>
              {isFree ? 'Free' : formatPrice(cost)}
            </span>
          </label>
        </li>
      </ul>
    </div>
  );
}
