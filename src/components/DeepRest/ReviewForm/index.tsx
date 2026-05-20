'use client';

import React, { useState } from 'react';
import { deepRestApi } from '@/lib/api/deepRest';
import StarRating from '@/components/common/StarRating';
import Button from '@/components/common/Button';
import styles from './styles.module.css';

interface ReviewFormProps {
  responseId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ responseId, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deepRestApi.submitReview(responseId, {
        rating,
        comment: comment.trim() || undefined,
      });

      if (result.success) {
        setSubmitted(true);
        onSuccess?.();
      } else {
        setError(result.message || 'Failed to submit review');
      }
    } catch {
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.container}>
        <p className={styles.success}>Thank you for your review! It will appear after admin approval.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h4 className={styles.heading}>Write a Review</h4>

      <StarRating rating={rating} interactive onChange={setRating} size="lg" />

      <textarea
        className={styles.textarea}
        placeholder="Share your experience with this session..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
      />

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth={false}
          onClick={handleSubmit}
          disabled={rating === 0}
          loading={isSubmitting}
        >
          Submit Review
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" size="md" fullWidth={false} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
