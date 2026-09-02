'use client';

import Image from 'next/image';
import type { ReviewableItem } from '@/lib/api/reviews';
import styles from './styles.module.css';

interface ItemPickerProps {
  items: ReviewableItem[];
  isLoading: boolean;
  /** Opened for a specific order/product rather than the full history. */
  isScoped: boolean;
  onSelect: (item: ReviewableItem) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** The "which purchase are you reviewing?" step of the review modal. */
export function ItemPicker({ items, isLoading, isScoped, onSelect }: ItemPickerProps) {
  return (
    <>
      <p className={styles.stepLabel}>{isScoped ? 'Select an item to review:' : 'Select an order to review:'}</p>
      {isLoading ? (
        <p className={styles.loadingText}>Loading your orders...</p>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No items to review right now.</p>
          <p className={styles.emptyHint}>
            {isScoped
              ? 'Reviews open up once you have purchased an item, and each item can be reviewed once.'
              : "Items from your paid orders that you haven't reviewed yet will appear here."}
          </p>
        </div>
      ) : (
        <div className={styles.itemList}>
          {items.map((item) => (
            <button key={`${item.itemId}_${item.itemType}`} className={styles.itemCard} onClick={() => onSelect(item)}>
              <div className={styles.itemImage}>
                {item.image ? (
                  <Image src={item.image} alt={item.name} width={48} height={48} />
                ) : (
                  <div className={styles.itemImagePlaceholder} />
                )}
              </div>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemMeta}>
                  {item.itemType === 'DriftOff' ? 'Deep Rest' : item.itemType} · {formatDate(item.orderDate)}
                </span>
              </div>
              <svg
                className={styles.chevron}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
