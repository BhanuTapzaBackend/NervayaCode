'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { StarRating, StatusState } from '@/components/common';
import { ICON_LOADING } from '@/constants/icons';
import { Icon } from '@iconify/react';
import ReviewCard from '../ReviewCard';
import { IMAGES } from '@/utils/imageConstants';
import { reviewsApi } from '@/lib/api/reviews';
import type { Supplement, Review, StarDistribution } from '@/types/supplement.types';
import { usePathname } from 'next/navigation';
import { trackReviewViewed } from '@/utils/analytics';
import styles from './TabReviews.module.css';

interface TabReviewsProps {
  supplement: Supplement;
}

const TabReviews: React.FC<TabReviewsProps> = ({ supplement }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reviewsApi.getByProductId(supplement._id, 1, 20);
      if (response.success && response.data?.data) {
        setReviews(response.data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [supplement._id]);

  const pathname = usePathname();

  useEffect(() => {
    fetchReviews();
    trackReviewViewed({
      review_source: 'product_detail',
      page_type: pathname,
      item_id: supplement._id,
    });
  }, [fetchReviews, pathname, supplement._id]);

  const averageRating = supplement.averageRating ?? 0;
  const reviewCount = supplement.reviewCount ?? 0;
  const starDistribution: StarDistribution = supplement.starDistribution ?? {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  const totalForPercent = reviewCount || 1;

  if (loading) {
    return (
      <div className={styles.content}>
        <div className={styles.loadingContainer} aria-busy="true" aria-live="polite">
          <Icon icon={ICON_LOADING} className={styles.loaderIcon} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.content}>
        <StatusState
          type="error"
          title="Failed to load reviews"
          message={error}
          action={
            <button type="button" onClick={fetchReviews} className={styles.retryButton}>
              Try again
            </button>
          }
        />
      </div>
    );
  }

  if (reviewCount === 0 && reviews.length === 0) {
    return (
      <div className={styles.content}>
        <div className={styles.emptyState}>
          <Image
            src={IMAGES.NO_DATA_FOUND}
            alt="No reviews yet"
            width={350}
            height={250}
            priority
            className={styles.emptyImage}
          />
          <h3 className={styles.emptyTitle}>No reviews yet</h3>
          <p className={styles.emptyMessage}>Be the first to review this product.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <div className={styles.summary}>
        <div className={styles.overall}>
          <span className={styles.ratingNumber}>{averageRating.toFixed(1)}</span>
          <StarRating rating={averageRating} size="lg" />
          <span className={styles.reviewCount}>{reviewCount} reviews</span>
        </div>
        <div className={styles.distribution}>
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = starDistribution[star] ?? 0;
            const percent = Math.round((count / totalForPercent) * 100);
            return (
              <div key={star} className={styles.barRow}>
                <span className={styles.barLabel}>{star} star</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${percent}%` }} />
                </div>
                <span className={styles.barPercent}>{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>
      <ul className={styles.list} aria-label="Reviews">
        {reviews.map((review) => (
          <li key={review._id}>
            <ReviewCard review={review} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabReviews;
