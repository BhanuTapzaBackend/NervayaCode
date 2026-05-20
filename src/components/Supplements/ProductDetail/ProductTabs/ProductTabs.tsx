'use client';

import React, { useState } from 'react';
import TabDescription from '../TabDescription';
import TabReviews from '../TabReviews';
import TabShippingDelivery from '../TabShippingDelivery';
import type { Supplement } from '@/types/supplement.types';
import styles from './ProductTabs.module.css';

type TabId = 'description' | 'reviews' | 'shipping';

interface ProductTabsProps {
  supplement: Supplement;
}

const ProductTabs: React.FC<ProductTabsProps> = ({ supplement }) => {
  const [activeTab, setActiveTab] = useState<TabId>('description');
  const reviewCount = supplement.reviewCount ?? 0;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'description', label: 'Description' },
    { id: 'reviews', label: `Reviews (${reviewCount})` },
    { id: 'shipping', label: 'Shipping & Delivery' },
  ];

  return (
    <div className={styles.tabs}>
      <div className={styles.tabList} role="tablist" aria-label="Product details">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id="panel-description"
        role="tabpanel"
        aria-labelledby="tab-description"
        hidden={activeTab !== 'description'}
        className={styles.panel}
      >
        {activeTab === 'description' && <TabDescription supplement={supplement} />}
      </div>
      <div
        id="panel-reviews"
        role="tabpanel"
        aria-labelledby="tab-reviews"
        hidden={activeTab !== 'reviews'}
        className={styles.panel}
      >
        {activeTab === 'reviews' && <TabReviews supplement={supplement} />}
      </div>
      <div
        id="panel-shipping"
        role="tabpanel"
        aria-labelledby="tab-shipping"
        hidden={activeTab !== 'shipping'}
        className={styles.panel}
      >
        {activeTab === 'shipping' && <TabShippingDelivery supplement={supplement} />}
      </div>
    </div>
  );
};

export default ProductTabs;
