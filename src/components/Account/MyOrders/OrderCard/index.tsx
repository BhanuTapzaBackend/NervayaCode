'use client';

import React from 'react';
import { Order } from '@/types/supplement.types';
import { OrderThumbnails } from './OrderThumbnails';
import { formatPrice } from '@/utils/cart.util';
import { Icon } from '@iconify/react';
import { ICON_CALENDAR_LUCIDE, ICON_HASHTAG, ICON_MAP_PIN, ICON_COPY, ICON_CHEVRON_RIGHT } from '@/constants/icons';
import styles from './styles.module.css';

interface OrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onViewDetails }) => {
  const firstItem = order.items?.[0] || { name: 'Order Items', quantity: 1, price: 0 };

  return (
    <li className={styles.orderCard}>
      <div className={styles.orderImagePlaceholder}>
        <OrderThumbnails items={order.items ?? []} />
      </div>

      <div className={styles.orderDetails}>
        <div className={styles.orderHeaderMain}>
          <h3 className={styles.productTitle}>{firstItem.name}</h3>
          <p className={styles.productSubtitle}>
            {order.items.length > 1
              ? `${order.items.length} items · ${formatPrice(order.totalAmount)}`
              : firstItem.quantity > 1
                ? `Qty ${firstItem.quantity} · ${formatPrice(order.totalAmount)}`
                : 'Supplement'}
          </p>
          <p className={styles.productDescription}>
            Your ordered items are currently being processed. Total amount: {formatPrice(order.totalAmount)}.
          </p>
        </div>

        <div className={styles.infoChips}>
          <div className={styles.chip}>
            <div className={styles.chipIconWrapper}>
              <Icon icon={ICON_CALENDAR_LUCIDE} className={styles.chipIcon} />
            </div>
            <div className={styles.chipText}>
              <span className={styles.chipLabel}>Order Date</span>
              <span className={styles.chipValue}>
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className={styles.chip}>
            <div className={styles.chipIconWrapper}>
              <Icon icon={ICON_HASHTAG} className={styles.chipIcon} />
            </div>
            <div className={styles.chipText}>
              <span className={styles.chipLabel}>Order ID</span>
              <span className={styles.chipValue}>{order._id.slice(-8)}</span>
            </div>
          </div>

          <div className={styles.chip}>
            <div className={styles.chipIconWrapper}>
              <Icon icon={ICON_MAP_PIN} className={styles.chipIcon} />
            </div>
            <div className={styles.chipText}>
              <span className={styles.chipLabel}>Tracking ID</span>
              <span className={styles.chipValue}>
                {order._id.slice(-8)}
                <button className={styles.copyBtn} aria-label="Copy tracking ID">
                  <Icon icon={ICON_COPY} />
                </button>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.orderActions}>
          <button onClick={() => onViewDetails(order)} className={styles.viewOrderLink}>
            View Order Details <Icon icon={ICON_CHEVRON_RIGHT} />
          </button>
        </div>
      </div>
    </li>
  );
};
