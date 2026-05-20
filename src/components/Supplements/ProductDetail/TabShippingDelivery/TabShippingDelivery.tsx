'use client';

import React, { useState, useEffect } from 'react';
import type { Supplement } from '@/types/supplement.types';
import { configApi } from '@/lib/api/config';
import styles from './TabShippingDelivery.module.css';

const DEFAULT_SHIPPING_SCRIPT = `We offer free shipping across India on all orders.
Order Processing: All orders are processed within 24 hours of confirmation.
Delivery Timeline: Once processed, your order will be delivered within 5–6 business days.
Order Tracking: You will receive tracking details as soon as your order is shipped, so you can stay updated every step of the way.
Need Help? For any issues or queries, feel free to reach out to us on WhatsApp: 8409179911 or email us at info@nervaya.com.
We aim to ensure a smooth and timely delivery experience for all our customers.`;

const RETURN_POLICY =
  "We offer a 30-day money-back guarantee on all products. If you're not completely satisfied with your purchase, simply return it within 30 days for a full refund. Products must be in original packaging and unused for return eligibility. Contact our customer service team to initiate a return.";

interface TabShippingDeliveryProps {
  supplement?: Supplement;
}

const TabShippingDelivery: React.FC<TabShippingDeliveryProps> = ({ supplement }) => {
  const [globalPolicy, setGlobalPolicy] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobalPolicy = async () => {
      try {
        const response = await configApi.getPublic();
        if (response.success && response.data?.shipping_policy) {
          setGlobalPolicy(String(response.data.shipping_policy));
        }
      } catch (err) {
        console.error('Failed to fetch global shipping policy:', err);
      }
    };
    fetchGlobalPolicy();
  }, []);

  const displayPolicy = globalPolicy || DEFAULT_SHIPPING_SCRIPT;

  return (
    <div className={styles.content}>
      <section className={styles.section}>
        <h3 className={styles.heading}>Shipping & Delivery</h3>
        <div className={styles.policyBox}>
          <p className={styles.policyText} style={{ whiteSpace: 'pre-wrap' }}>
            {displayPolicy}
          </p>
        </div>
      </section>

      {supplement?.shippingAddress && (
        <section className={styles.section}>
          <h3 className={styles.heading}>Fulfillment Location</h3>
          <div className={styles.policyBox}>
            <p className={styles.policyText}>
              <strong>Ships from:</strong> {supplement.shippingAddress}
            </p>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h3 className={styles.heading}>Returns</h3>
        <div className={styles.policyBox}>
          <p className={styles.policyText}>{RETURN_POLICY}</p>
        </div>
      </section>
    </div>
  );
};

export default TabShippingDelivery;
