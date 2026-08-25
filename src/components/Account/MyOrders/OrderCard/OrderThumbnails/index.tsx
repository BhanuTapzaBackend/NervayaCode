'use client';

import React from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_BOX } from '@/constants/icons';
import type { OrderItem } from '@/types/supplement.types';
import styles from './styles.module.css';

/** Beyond this the mosaic stops adding tiles and the last one becomes a "+N". */
const MAX_TILES = 4;

/** Stable key: an order never repeats the same item type + id. */
function tileKey(item: OrderItem): string {
  const raw = item.itemId as { _id?: string } | string;
  const id = typeof raw === 'object' && raw?._id ? raw._id : String(raw);
  return `${item.itemType}-${id}`;
}

export interface OrderThumbnailsProps {
  items: OrderItem[];
}

/**
 * Item images for an order, laid out to fill one square regardless of count:
 * one fills it, two split it, three make a mosaic with a tall lead image, and
 * four or more use a 2×2 where the last tile counts the remainder.
 */
export function OrderThumbnails({ items }: OrderThumbnailsProps) {
  const count = items.length;
  const tiles = items.slice(0, MAX_TILES);
  // With more than MAX_TILES, the final tile is given up to the counter, so the
  // overflow has to include the item whose image it replaces.
  const overflow = count > MAX_TILES ? count - (MAX_TILES - 1) : 0;
  const visible = overflow > 0 ? tiles.slice(0, MAX_TILES - 1) : tiles;

  const layout = count === 1 ? styles.one : count === 2 ? styles.two : count === 3 ? styles.three : styles.four;

  return (
    <div className={`${styles.grid} ${layout}`} aria-hidden="true">
      {visible.map((item) => (
        <div key={tileKey(item)} className={styles.tile}>
          {item.image ? (
            <Image src={item.image} alt="" fill sizes="80px" className={styles.image} />
          ) : (
            <span className={styles.fallback}>
              <Icon icon={ICON_BOX} width={20} height={20} />
            </span>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div className={`${styles.tile} ${styles.more}`}>
          <span className={styles.moreText}>+{overflow}</span>
        </div>
      )}
    </div>
  );
}

export default OrderThumbnails;
