'use client';

import React from 'react';
import { Order } from '@/types/supplement.types';
import { OrderThumbnails } from './OrderThumbnails';
import { formatPrice } from '@/utils/cart.util';
import { Icon } from '@iconify/react';
import {
  ICON_CALENDAR_LUCIDE,
  ICON_HASHTAG,
  ICON_MAP_PIN,
  ICON_COPY,
  ICON_CHEVRON_RIGHT,
  ICON_STAR,
} from '@/constants/icons';
import { PAYMENT_STATUS, ORDER_STATUS, ITEM_TYPE } from '@/lib/constants/enums';
import { openReviewModal } from '@/constants/events';
import styles from './styles.module.css';

interface OrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onViewDetails }) => {
  const firstItem = order.items?.[0] || { name: 'Order Items', quantity: 1, price: 0 };
  // Paid, live orders can be reviewed (single supplement or a bundle — the modal
  // shows this order's items). Deep Rest is excluded: it has its own moderated
  // review flow. The modal is scoped by item ids, not the order id, because the
  // reviewable list dedupes repeat purchases onto the newest order.
  const reviewableItemIds = (order.items ?? [])
    .filter((item) => item.itemType !== ITEM_TYPE.DRIFT_OFF)
    .map((item) => {
      const raw = item.itemId as { _id?: string } | string;
      return typeof raw === 'object' && raw?._id ? raw._id : String(raw);
    });
  const canReview =
    order.paymentStatus === PAYMENT_STATUS.PAID &&
    order.orderStatus !== ORDER_STATUS.CANCELLED &&
    reviewableItemIds.length > 0;

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
          {canReview && (
            <button
              onClick={() => openReviewModal(reviewableItemIds)}
              className={styles.reviewLink}
              aria-label={`Rate and review items from order ${order._id.slice(-8)}`}
            >
              <Icon icon={ICON_STAR} /> Rate & Review
            </button>
          )}
        </div>
      </div>
    </li>
  );
};
