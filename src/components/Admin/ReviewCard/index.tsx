'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { adminReviewsApi, type AdminReview } from '@/lib/api/adminReviews';
import StarRating from '@/components/common/StarRating';
import { formatReviewDate } from '@/utils/date.util';
import styles from './styles.module.css';

interface ReviewCardProps {
  review: AdminReview;
  onVisibilityToggled: () => void;
}

function formatItemType(itemType: string): string {
  if (itemType === 'DriftOff') return 'Deep Rest';
  if (itemType === 'Therapy') return 'Therapy';
  return 'Supplement';
}

export default function ReviewCard({ review, onVisibilityToggled }: ReviewCardProps) {
  const [toggling, setToggling] = useState(false);

  const product = typeof review.productId === 'object' ? review.productId : null;
  const productName = product?.name ?? (review.itemType === 'DriftOff' ? 'Deep Rest Session' : 'Unknown Product');
  const formattedDate = formatReviewDate(review.createdAt);

  const handleToggleVisibility = async () => {
    try {
      setToggling(true);
      const response = await adminReviewsApi.toggleVisibility(review._id);
      if (response.success) {
        toast.success(`Review ${review.isVisible ? 'hidden' : 'approved'} successfully`);
        onVisibilityToggled();
      } else {
        toast.error(response.message ?? 'Failed to toggle visibility');
      }
    } catch {
      toast.error('Failed to toggle visibility');
    } finally {
      setToggling(false);
    }
  };

  return (
    <li className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.leftGroup}>
          {product?.image && (
            <div className={styles.productImage}>
              <Image src={product.image} alt={productName} width={48} height={48} />
            </div>
          )}
          <div className={styles.headerInfo}>
            <div className={styles.topRow}>
              <h3 className={styles.productName}>{productName}</h3>
              <span className={`${styles.itemBadge} ${styles[`badge${review.itemType}`]}`}>
                {formatItemType(review.itemType)}
              </span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.userName}>{review.userDisplayName ?? 'Anonymous'}</span>
              <span className={styles.separator}>·</span>
              <StarRating rating={review.rating} size="sm" />
              <span className={styles.separator}>·</span>
              <span className={styles.reviewDate}>{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={`${styles.statusLabel} ${review.isVisible ? styles.statusApproved : styles.statusHidden}`}>
            {review.isVisible ? 'Approved' : 'Hidden'}
          </span>
          <button
            type="button"
            className={`${styles.toggle} ${review.isVisible ? styles.toggleOn : styles.toggleOff}`}
            onClick={handleToggleVisibility}
            disabled={toggling}
            aria-label={review.isVisible ? 'Hide review' : 'Approve review'}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>
      </div>

      {review.comment && (
        <div className={styles.cardBody}>
          <p className={styles.comment}>&ldquo;{review.comment}&rdquo;</p>
        </div>
      )}
    </li>
  );
}
