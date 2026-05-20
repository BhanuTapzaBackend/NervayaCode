'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ITEM_TYPE, type ItemType } from '@/lib/constants/enums';
import type { CartItem as CartItemType, Supplement } from '@/types/supplement.types';
import { QuantitySelector } from '@/components/common';
import { formatPrice } from '@/utils/cart.util';
import styles from './styles.module.css';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange?: (itemId: string, quantity: number, itemType: ItemType) => void;
  onRemove?: (itemId: string, itemType: ItemType) => void;
  disabled?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({ item, onQuantityChange, onRemove, disabled = false }) => {
  const isSupplement = item.itemType === ITEM_TYPE.SUPPLEMENT;
  const supplement =
    isSupplement && typeof item.itemId === 'object' && item.itemId && 'name' in item.itemId
      ? (item.itemId as Supplement)
      : null;

  const idStr = typeof item.itemId === 'object' ? supplement?._id : item.itemId;

  const defaultImage = isSupplement ? '/default-supplement.png' : '/drift-off-session.png';
  const itemName = item.name || supplement?.name || 'Session';
  const itemImage = item.image || supplement?.image || defaultImage;
  const maxStock = isSupplement ? supplement?.stock || item.quantity : 10;

  const handleQuantityChange = (newQuantity: number) => {
    if (onQuantityChange && idStr) {
      onQuantityChange(idStr.toString(), newQuantity, item.itemType);
    }
  };

  const handleRemove = () => {
    if (onRemove && idStr) {
      onRemove(idStr.toString(), item.itemType);
    }
  };

  const itemTotal = item.price * item.quantity;

  return (
    <div className={styles.cartItem}>
      <Link
        href={isSupplement && supplement ? `/sleep-supplements/${supplement._id}` : '#'}
        className={styles.imageLink}
      >
        <div className={styles.imageWrapper}>
          <Image
            src={itemImage}
            alt={itemName}
            width={120}
            height={120}
            className={styles.image}
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />
        </div>
      </Link>
      <div className={styles.details}>
        <Link
          href={isSupplement && supplement ? `/sleep-supplements/${supplement._id}` : '#'}
          className={styles.nameLink}
        >
          <h3 className={styles.name}>{itemName}</h3>
        </Link>
        <p className={styles.price}>{formatPrice(item.price)} each</p>
        <div className={styles.actions}>
          {isSupplement && (
            <QuantitySelector
              value={item.quantity}
              onChange={handleQuantityChange}
              min={1}
              max={maxStock}
              disabled={disabled}
            />
          )}
          <button className={styles.removeButton} onClick={handleRemove} disabled={disabled} aria-label="Remove item">
            Remove
          </button>
        </div>
      </div>
      <div className={styles.total}>
        <div className={styles.totalPrice}>{formatPrice(itemTotal)}</div>
      </div>
    </div>
  );
};

export default CartItem;
