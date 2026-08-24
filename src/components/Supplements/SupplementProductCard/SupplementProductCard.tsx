'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Supplement } from '@/types/supplement.types';
import { formatPrice } from '@/utils/cart.util';
import { StarRating } from '@/components/common';
import { ITEM_TYPE } from '@/lib/constants/enums';
import { getApiErrorMessage } from '@/lib/api/apiError';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/routesConstants';
import styles from './SupplementProductCard.module.css';

interface SupplementProductCardProps {
  supplement: Supplement;
  onAddToCart?: (supplementId: string, quantity: number) => Promise<void> | void;
  variant?: 'grid' | 'list';
}

const SupplementProductCard: React.FC<SupplementProductCardProps> = ({ supplement, onAddToCart, variant = 'grid' }) => {
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const router = useRouter();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const imageUrl = supplement.images?.length ? supplement.images[0] : supplement.image;
  const originalPrice = supplement.originalPrice;
  const hasDiscount = originalPrice != null && originalPrice > supplement.price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - supplement.price) / originalPrice) * 100)
    : undefined;
  const isOutOfStock = !supplement.stock || supplement.stock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    setAdding(true);
    try {
      if (onAddToCart) {
        await onAddToCart(supplement._id, 1);
      } else {
        const result = await addItem({
          itemId: supplement._id,
          itemType: ITEM_TYPE.SUPPLEMENT,
          quantity: 1,
          name: supplement.name,
          price: supplement.price,
          image: imageUrl,
        });
        if (!result.success) {
          toast.error(result.message || 'Unable to add to cart. This item may be out of stock.');
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to add to cart. This item may be out of stock.'));
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    setBuying(true);
    try {
      if (onAddToCart) {
        await onAddToCart(supplement._id, 1);
      } else {
        await addItem({
          itemId: supplement._id,
          itemType: ITEM_TYPE.SUPPLEMENT,
          quantity: 1,
          name: supplement.name,
          price: supplement.price,
          image: imageUrl,
        });
      }
      if (!isAuthenticated) {
        router.push(`${ROUTES.LOGIN}?returnUrl=${encodeURIComponent('/checkout')}`);
      } else {
        router.push('/checkout');
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to add to cart. This item may be out of stock.'));
    } finally {
      setBuying(false);
    }
  };

  const description = supplement.shortDescription || supplement.description;
  const truncatedDesc = description.length > 120 ? `${description.substring(0, 120)}...` : description;

  return (
    <article className={`${styles.card} ${variant === 'list' ? styles.listVariant : ''}`}>
      <Link href={`/sleep-supplements/${supplement._id}`} className={styles.imageLink}>
        <div className={styles.imageWrap}>
          <Image
            src={imageUrl || '/default-supplement.png'}
            alt={supplement.name}
            width={300}
            height={300}
            className={styles.image}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-supplement.png';
            }}
          />
          {discountPercent != null && discountPercent > 0 && <span className={styles.badge}>SALE</span>}
        </div>
      </Link>
      <div className={styles.content}>
        <Link href={`/sleep-supplements/${supplement._id}`} className={styles.nameLink}>
          <h3 className={styles.name}>{supplement.name}</h3>
        </Link>
        <p className={styles.description}>{truncatedDesc}</p>
        <div className={styles.ratingRow}>
          <StarRating rating={supplement.averageRating ?? 0} size="sm" />
          <span className={styles.reviewCount}>{supplement.reviewCount ?? 0}</span>
        </div>
        <div className={styles.priceRow}>
          {hasDiscount && originalPrice != null && (
            <span className={styles.mrp}>MRP: {formatPrice(originalPrice)}</span>
          )}
          <span className={styles.price}>{formatPrice(supplement.price)}</span>
        </div>
        <div className={styles.actions}>
          {!isOutOfStock ? (
            <div className={styles.buttonGroup}>
              <button type="button" onClick={handleBuyNow} disabled={adding || buying} className={styles.buyNowButton}>
                {buying ? 'Processing...' : 'BUY NOW'}
              </button>
              <button type="button" onClick={handleAddToCart} disabled={adding || buying} className={styles.addButton}>
                {adding ? 'Adding...' : 'ADD TO CART'}
              </button>
            </div>
          ) : (
            <span className={styles.outOfStock}>Out of Stock</span>
          )}
        </div>
      </div>
    </article>
  );
};

export default SupplementProductCard;
