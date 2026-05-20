'use client';

import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { ICON_X, ICON_GLOBE, ICON_LOCATION } from '@/constants/icons';
import { Order } from '@/types/supplement.types';
import { formatPrice } from '@/utils/cart.util';
import { getShippingCost } from '@/utils/shipping.util';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import styles from './styles.module.css';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose }) => {
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = getShippingCost(subtotal);
  const modalRef = useRef<HTMLDivElement>(null);
  useModalDismiss(true, modalRef, onClose);

  return createPortal(
    <div className={styles.modalOverlay}>
      <div ref={modalRef} className={styles.modalContent} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Order Details</h3>
          <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <Icon icon={ICON_X} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.orderSummary}>
            <div className={styles.orderHeaderSection}>
              <div className={styles.orderHeaderGroup}>
                <span className={styles.orderHeaderLabel}>Order Number</span>
                <span className={styles.orderHeaderValue}>
                  NS-{new Date().getFullYear()}-{order._id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>

            <div className={styles.orderSection}>
              <h3 className={styles.sectionTitle}>
                <Icon icon={ICON_GLOBE} className={styles.sectionIcon} /> Order Items
              </h3>
              <ul className={styles.itemsList}>
                {order.items.map((item) => (
                  <li key={item.itemId.toString()} className={styles.itemRow}>
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.orderSection}>
              <h3 className={styles.sectionTitle}>
                <Icon icon={ICON_LOCATION} className={styles.sectionIcon} /> Shipping Address
              </h3>
              {order.shippingAddress ? (
                <address className={styles.address}>
                  {order.shippingAddress.name}
                  <br />
                  {order.shippingAddress.addressLine1}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </address>
              ) : (
                <div className={styles.digitalDeliveryText}>Digital Delivery via email & profile access</div>
              )}
            </div>

            <div className={styles.financialSummary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span className={shippingCost === 0 ? styles.shipFree : ''}>
                  {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                </span>
              </div>
              {order.promoDiscount !== undefined && order.promoDiscount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Discount</span>
                  <span className={styles.discount}>-{formatPrice(order.promoDiscount)}</span>
                </div>
              )}
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
