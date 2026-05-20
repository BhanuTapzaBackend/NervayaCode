'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { ICON_SHOPPING_BAG } from '@/constants/icons';
import Link from 'next/link';
import styles from './styles.module.css';

export const EmptyOrders: React.FC = () => (
  <div className={styles.emptyState}>
    <div className={styles.iconWrapper}>
      <Icon icon={ICON_SHOPPING_BAG} className={styles.icon} />
    </div>
    <h3 className={styles.emptyTitle}>No orders yet</h3>
    <p className={styles.emptyText}>Your product purchases will appear here</p>
    <Link href="/sleep-supplements" className={styles.shopLink}>
      Browse Supplements
    </Link>
  </div>
);
