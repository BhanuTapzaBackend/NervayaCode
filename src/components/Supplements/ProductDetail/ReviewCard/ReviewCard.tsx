'use client';

import React from 'react';
import { StarRating } from '@/components/common';
import type { Review } from '@/types/supplement.types';
import styles from './ReviewCard.module.css';

interface ReviewCardProps {
  review: Review;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return `${Math.floor(diffMonths / 12)} year(s) ago`;
}

const getInitial = (name?: string): string => {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const displayName = review.userDisplayName || 'Anonymous';
  const initial = getInitial(displayName);

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatar} aria-hidden>
          {initial}
        </div>
        <div className={styles.meta}>
          <span className={styles.name}>{displayName}</span>
          <span className={styles.time}>{formatTimeAgo(review.createdAt)}</span>
        </div>
      </div>
      <div className={styles.rating}>
        <StarRating rating={review.rating} maxStars={5} size="sm" />
      </div>
      {review.comment && <p className={styles.comment}>{review.comment}</p>}
    </article>
  );
};

export default ReviewCard;
