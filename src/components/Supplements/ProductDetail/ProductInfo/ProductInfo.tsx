'use client';

import React from 'react';
import NextImage from 'next/image';
import { QuantitySelector, Button, StarRating } from '@/components/common';
import { formatPrice } from '@/utils/cart.util';
import type { Supplement } from '@/types/supplement.types';
import styles from './ProductInfo.module.css';

interface ProductInfoProps {
  supplement: Supplement;
  quantity: number;
  onQuantityChange: (q: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  adding: boolean;
  buying: boolean;
  isOutOfStock: boolean;
  maxQuantity: number;
  error: string | null;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  supplement,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  adding,
  buying,
  isOutOfStock,
  maxQuantity,
  error,
}) => {
  const savings =
    supplement.originalPrice && supplement.originalPrice > supplement.price
      ? supplement.originalPrice - supplement.price
      : 0;

  return (
    <div className={styles.info}>
      <h1 className={styles.title}>{supplement.name}</h1>
      {supplement.shortDescription && <p className={styles.tagline}>{supplement.shortDescription}</p>}
      <div className={styles.ratingRow}>
        <StarRating rating={supplement.averageRating ?? 0} showValue size="md" className={styles.stars} />
        <span className={styles.reviewCount}>{supplement.reviewCount ?? 0} reviews</span>
      </div>
      <div className={styles.priceRow}>
        <div className={styles.pricePair}>
          {supplement.originalPrice != null && supplement.originalPrice > supplement.price && (
            <span className={styles.originalPrice}>MRP: {formatPrice(supplement.originalPrice)}</span>
          )}
          <span className={styles.price}>{formatPrice(supplement.price)}</span>
        </div>
        {savings > 0 && <span className={styles.savings}>Save {formatPrice(savings)} today!</span>}
      </div>
      {isOutOfStock ? (
        <div className={styles.outOfStockSection}>
          <span className={styles.outOfStockBadge}>Out of Stock</span>
          <p className={styles.outOfStockHint}>This product is currently unavailable. Please check back later.</p>
        </div>
      ) : (
        <div className={styles.quantityActionsRow}>
          <div className={styles.quantityRow}>
            <QuantitySelector
              value={quantity}
              onChange={onQuantityChange}
              min={1}
              max={maxQuantity}
              disabled={adding}
            />
          </div>
          <div className={styles.actions}>
            <Button
              variant="primary"
              onClick={onAddToCart}
              loading={adding}
              disabled={adding || buying || isOutOfStock}
              className={styles.addButton}
            >
              Add to Cart
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={onBuyNow}
              loading={buying}
              disabled={adding || buying || isOutOfStock}
              className={styles.buyNowButton}
            >
              Buy Now
            </Button>
          </div>
        </div>
      )}
      {error && <div className={styles.error}>{error}</div>}

      <ul className={styles.trustBadges} aria-label="Product certifications">
        {[
          { src: '/assets/GMP_Logo.jpeg', label: 'GMP Certified', width: 100, height: 100 },
          { src: '/badge.png', label: 'Quality Pure', width: 44, height: 44 },
          { src: '/safety.png', label: 'No Side Effects', width: 44, height: 44 },
        ].map((item) => (
          <li key={item.label} className={styles.trustBadgeItem}>
            <div className={styles.trustIconContainer}>
              <NextImage
                src={item.src}
                alt={item.label}
                width={item.width}
                height={item.height}
                className={styles.trustImage}
              />
            </div>
            <span className={styles.trustLabelText}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductInfo;
