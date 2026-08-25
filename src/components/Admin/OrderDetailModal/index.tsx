'use client';

import React from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_BOX, ICON_CREDIT_CARD, ICON_LOCATION } from '@/constants/icons';
import Modal from '@/components/common/Modal';
import { Badge } from '@/components/common';
import { formatPrice } from '@/utils/cart.util';
import { formatOrderId, orderStatusVariant, paymentStatusVariant } from '@/utils/order-status.util';
import type { Order, OrderItem, ShippingAddress } from '@/types/supplement.types';
import styles from './styles.module.css';

export interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
}

function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatAddress(address: ShippingAddress): string {
  return [address.addressLine1, address.addressLine2, address.city, address.state, address.zipCode, address.country]
    .filter(Boolean)
    .join(', ');
}

/** Stable list key: orders never repeat the same item type + id twice. */
function itemKey(item: OrderItem): string {
  const raw = item.itemId as { _id?: string } | string;
  const id = typeof raw === 'object' && raw?._id ? raw._id : String(raw);
  return `${item.itemType}-${id}`;
}

function itemsSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  if (!order) return null;

  const subtotal = itemsSubtotal(order.items);
  const discount = order.promoDiscount ?? 0;
  // Anything the line items and the promo don't account for is shipping/handling.
  const extras = order.totalAmount - (subtotal - discount);
  const address = order.shippingAddress;
  const hasAddress = Boolean(address?.addressLine1 || address?.city);

  return (
    <Modal isOpen onClose={onClose} title={`Order ${formatOrderId(String(order._id))}`}>
      <div className={styles.body}>
        <div className={styles.statusRow}>
          <Badge variant={orderStatusVariant(order.orderStatus)} shape="pill" size="sm">
            {order.orderStatus}
          </Badge>
          <Badge variant={paymentStatusVariant(order.paymentStatus)} shape="pill" size="sm">
            {order.paymentStatus}
          </Badge>
          <span className={styles.placedAt}>{formatDateTime(order.createdAt)}</span>
        </div>

        <section className={styles.section} aria-label="Items">
          <h4 className={styles.sectionTitle}>
            <Icon icon={ICON_BOX} aria-hidden="true" />
            Items ({order.items.length})
          </h4>
          <ul className={styles.itemList}>
            {order.items.map((item) => (
              <li key={itemKey(item)} className={styles.item}>
                {item.image ? (
                  <Image src={item.image} alt="" width={44} height={44} className={styles.itemImage} />
                ) : (
                  <span className={styles.itemImageFallback} aria-hidden="true">
                    <Icon icon={ICON_BOX} />
                  </span>
                )}
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemMeta}>
                    {item.itemType} · {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <span className={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>

        {hasAddress && (
          <section className={styles.section} aria-label="Customer and shipping">
            <h4 className={styles.sectionTitle}>
              <Icon icon={ICON_LOCATION} aria-hidden="true" />
              Customer & Shipping
            </h4>
            <p className={styles.addressName}>
              {address.name}
              {address.phone ? <span className={styles.addressPhone}> · {address.phone}</span> : null}
            </p>
            <p className={styles.address}>{formatAddress(address)}</p>
          </section>
        )}

        <section className={styles.section} aria-label="Payment">
          <h4 className={styles.sectionTitle}>
            <Icon icon={ICON_CREDIT_CARD} aria-hidden="true" />
            Payment
          </h4>
          <dl className={styles.meta}>
            <div className={styles.metaRow}>
              <dt>Payment ID</dt>
              <dd className={styles.mono}>{order.paymentId ?? '—'}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Razorpay order</dt>
              <dd className={styles.mono}>{order.razorpayOrderId ?? '—'}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Customer ID</dt>
              <dd className={styles.mono}>{String(order.userId)}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.totals} aria-label="Order total">
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className={styles.totalRow}>
              <span>Promo{order.promoCode ? ` (${order.promoCode})` : ''}</span>
              <span className={styles.discount}>−{formatPrice(discount)}</span>
            </div>
          )}
          {extras !== 0 && (
            <div className={styles.totalRow}>
              <span>Shipping &amp; other</span>
              <span>{formatPrice(extras)}</span>
            </div>
          )}
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <span>Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </section>
      </div>
    </Modal>
  );
}
