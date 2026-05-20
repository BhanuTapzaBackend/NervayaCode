'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ICON_DISCOUNT } from '@/constants/icons';
import { therapistsApi } from '@/lib/api/therapists';
import PromoCodeInput from '../PromoCodeInput';
import styles from './styles.module.css';
export interface BookingModalFooterProps {
  selectedSlot: string | null;
  booking: boolean;
  loading: boolean;
  onBook: () => void | Promise<void>;
  onAddToCart?: () => void | Promise<void>;
  therapistId?: string;
  therapistName?: string;
  selectedDate?: string;
  sessionFee?: number;
  isRescheduling?: boolean;
}

export function BookingModalFooter({
  selectedSlot,
  booking,
  loading,
  onBook,
  onAddToCart,
  therapistId,
  therapistName: _therapistName,
  selectedDate: _selectedDate,
  sessionFee: propSessionFee,
  isRescheduling,
}: BookingModalFooterProps) {
  const [showPromo, setShowPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [sessionFee, setSessionFee] = useState<number>(propSessionFee || 0);

  useEffect(() => {
    const fetchTherapist = async () => {
      if (therapistId && !propSessionFee) {
        try {
          const response = await therapistsApi.getById(therapistId);
          if (response.success && response.data) {
            setSessionFee(response.data.sessionFee || 0);
          }
        } catch {
          // Handle error silently for now
        }
      }
    };

    fetchTherapist();
  }, [therapistId, propSessionFee]);

  const handlePromoApply = async (code: string) => {
    try {
      // For now, simulate promo validation (in real implementation, this would call API)
      if (code.toUpperCase() === 'SAVE10') {
        const discount = Math.round(sessionFee * 0.1); // 10% discount
        setAppliedPromo({ code, discount });
        setPromoError(null);
      } else if (code.toUpperCase() === 'FIXED20') {
        const discount = 20; // Fixed ₹20 off
        setAppliedPromo({ code, discount });
        setPromoError(null);
      } else {
        setPromoError('Invalid promo code');
      }
    } catch (_err) {
      setPromoError('Failed to apply promo code');
    }
  };

  const handlePromoRemove = () => {
    setAppliedPromo(null);
    setPromoError(null);
    setShowPromo(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const finalPrice = sessionFee - (appliedPromo?.discount || 0);
  const originalPrice = sessionFee;

  return (
    <div className={styles.footer}>
      {!isRescheduling && (
        <>
          {showPromo ? (
            <PromoCodeInput
              onPromoApply={handlePromoApply}
              onPromoRemove={handlePromoRemove}
              disabled={loading}
              error={promoError}
              discount={appliedPromo?.discount}
              originalPrice={originalPrice}
            />
          ) : (
            <button
              className={styles.promoToggle}
              onClick={() => setShowPromo(true)}
              disabled={loading}
              aria-label="Add promo code"
            >
              <Icon icon={ICON_DISCOUNT} width={16} height={16} />
              <span>Add Promo Code</span>
            </button>
          )}

          {appliedPromo && (
            <div className={styles.promoSummary}>
              <span className={styles.promoText}>
                Promo <span className={styles.promoCode}>{appliedPromo.code}</span> applied
              </span>
              <span className={styles.savings}>Save {formatPrice(appliedPromo.discount)}</span>
            </div>
          )}

          <div className={styles.priceSection}>
            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>Session Fee</span>
              <div className={styles.priceDisplay}>
                {appliedPromo ? (
                  <>
                    <span className={styles.originalPrice}>{formatPrice(originalPrice)}</span>
                    <span className={styles.finalPrice}>{formatPrice(finalPrice)}</span>
                  </>
                ) : (
                  <span className={styles.finalPrice}>{formatPrice(originalPrice)}</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {isRescheduling && (
        <div className={styles.rescheduleNotice}>
          <Icon icon="solar:info-circle-bold" width={16} height={16} />
          <span>Rescheduling will replace your existing appointment.</span>
        </div>
      )}

      <div className={styles.buttonGroup}>
        {!isRescheduling && (
          <button
            className={styles.cartBtn}
            onClick={onAddToCart}
            disabled={!selectedSlot || booking || loading}
            aria-label="Add session to cart"
          >
            Add to Cart
          </button>
        )}
        <button
          className={`${styles.primaryBtn} ${isRescheduling ? styles.rescheduleBtn : ''}`}
          onClick={onBook}
          disabled={!selectedSlot || booking || loading}
          aria-label={isRescheduling ? 'Confirm rescheduling' : 'Book selected session'}
        >
          {booking ? 'Processing...' : isRescheduling ? 'Confirm Reschedule' : 'Book Session'}
        </button>
      </div>

      {!isRescheduling && (
        <p className={styles.helpText}>
          Trouble finding a slot? <a href="/support">Let Us Help You</a>
        </p>
      )}
    </div>
  );
}
