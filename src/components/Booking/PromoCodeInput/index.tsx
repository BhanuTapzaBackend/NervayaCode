'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { ICON_DISCOUNT, ICON_X } from '@/constants/icons';
import styles from './styles.module.css';

interface PromoCodeInputProps {
  onPromoApply: (code: string) => void;
  onPromoRemove: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string | null;
  discount?: number;
  originalPrice?: number;
}

export default function PromoCodeInput({
  onPromoApply,
  onPromoRemove,
  disabled = false,
  isLoading = false,
  error = null,
  discount,
  originalPrice,
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim() && !disabled) {
      onPromoApply(promoCode.trim());
    }
  };

  const handleRemove = () => {
    setPromoCode('');
    onPromoRemove();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Icon icon={ICON_DISCOUNT} width={16} height={16} className={styles.icon} />
        <span className={styles.title}>Have a promo code?</span>
      </div>

      {discount ? (
        <div className={styles.applied}>
          <div className={styles.success}>
            <Icon icon={ICON_DISCOUNT} width={14} height={14} />
            <span className={styles.code}>{promoCode}</span> applied
          </div>
          <div className={styles.discountBreakdown}>
            <span className={styles.originalPrice}>{formatPrice(originalPrice || 0)}</span>
            <span className={styles.discountedPrice}>{formatPrice(discount)}</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className={styles.removeButton}
            aria-label="Remove promo code"
          >
            <Icon icon={ICON_X} width={12} height={12} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter promo code"
              className={styles.input}
              disabled={disabled || isLoading}
              aria-label="Promo code"
              aria-invalid={!!error}
            />
            <button
              type="submit"
              disabled={disabled || isLoading || !promoCode.trim()}
              className={styles.applyButton}
              aria-label="Apply promo code"
            >
              {isLoading ? 'Applying...' : 'Apply'}
            </button>
          </div>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
