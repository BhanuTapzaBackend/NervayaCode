'use client';

import React, { useState } from 'react';
import styles from './styles.module.css';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

type StarType = 'full' | 'half' | 'empty';

function buildStarItems(rating: number, maxStars: number): { type: StarType; key: string }[] {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const items: { type: StarType; key: string }[] = [];
  let keyIndex = 0;
  for (let i = 0; i < fullStars; i++) {
    items.push({ type: 'full', key: `star-${keyIndex++}` });
  }
  if (hasHalf) {
    items.push({ type: 'half', key: `star-${keyIndex++}` });
  }
  const emptyCount = maxStars - items.length;
  for (let i = 0; i < emptyCount; i++) {
    items.push({ type: 'empty', key: `star-${keyIndex++}` });
  }
  return items;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  showValue = false,
  className = '',
  interactive = false,
  onChange,
}) => {
  const [hovered, setHovered] = useState(0);

  if (interactive) {
    const displayRating = hovered || rating;
    return (
      <div
        className={`${styles.container} ${styles[size]} ${styles.interactive} ${className}`}
        role="radiogroup"
        aria-label={`Rate up to ${maxStars} stars`}
      >
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const active = starValue <= displayRating;
          return (
            <button
              key={starValue}
              type="button"
              className={`${styles.star} ${active ? styles.full : styles.empty} ${styles.starButton}`}
              onMouseEnter={() => setHovered(starValue)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onChange?.(starValue)}
              aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
              aria-checked={starValue === rating}
              role="radio"
            >
              ★
            </button>
          );
        })}
      </div>
    );
  }

  const starItems = buildStarItems(rating, maxStars);

  return (
    <div
      className={`${styles.container} ${styles[size]} ${className}`}
      role="img"
      aria-label={`${rating} out of ${maxStars} stars`}
    >
      {starItems.map((item) => (
        <span key={item.key} className={`${styles.star} ${styles[item.type]}`}>
          ★
        </span>
      ))}
      {showValue && <span className={styles.value}>{rating.toFixed(1)}</span>}
    </div>
  );
};

export default StarRating;
