'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useFloatingActions } from '@/context/FloatingActionsContext';
import { ROLES } from '@/lib/constants/roles';
import { reviewsApi, type ReviewableItem } from '@/lib/api/reviews';
import { useReviewableItems } from '@/queries/reviews/useReviewableItems';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { toast } from 'sonner';
import Image from 'next/image';
import styles from './styles.module.css';
import { trackReviewSubmitted } from '@/utils/analytics';

type ModalState = 'idle' | 'selectItem' | 'writeReview' | 'submitting' | 'success';

export function WriteReviewModal() {
  const { user } = useAuthContext();
  const { isExpanded, registerButton } = useFloatingActions();
  const [state, setState] = useState<ModalState>('idle');
  const [selectedItem, setSelectedItem] = useState<ReviewableItem | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const isCustomer = user?.role === ROLES.CUSTOMER;
  const { data: reviewableItems, isLoading: itemsLoading, refetch } = useReviewableItems(isCustomer);
  const showFloatingButton = isCustomer && state === 'idle' && !itemsLoading && reviewableItems.length > 0;

  useEffect(() => {
    if (!showFloatingButton) return;
    return registerButton();
  }, [showFloatingButton, registerButton]);

  const handleOpen = useCallback(() => {
    setState('selectItem');
    setSelectedItem(null);
    setRating(0);
    setHoverRating(0);
    setComment('');
    refetch();
  }, [refetch]);

  const handleClose = useCallback(() => {
    setState('idle');
  }, []);

  useModalDismiss(state !== 'idle', modalRef, handleClose);

  const handleSelectItem = useCallback((item: ReviewableItem) => {
    setSelectedItem(item);
    setRating(0);
    setHoverRating(0);
    setComment('');
    setState('writeReview');
  }, []);

  const handleBack = useCallback(() => {
    setState('selectItem');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedItem || rating === 0) return;
    setState('submitting');
    try {
      const trimmedComment = comment.trim();
      await reviewsApi.create(selectedItem.itemId, rating, trimmedComment || undefined, selectedItem.itemType);
      trackReviewSubmitted({
        rating_value: rating,
        review_length: trimmedComment.length,
        review_target: selectedItem.itemType,
        item_id: selectedItem.itemId,
        page_type: window.location.pathname,
      });
      setState('success');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      toast.error('Failed to submit review. Please try again.');
      setState('writeReview');
    }
  }, [selectedItem, rating, comment]);

  if (!isCustomer) return null;

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <>
      {showFloatingButton && (
        <button
          className={`${styles.floatingButton} ${!isExpanded ? styles.collapsed : ''}`}
          onClick={handleOpen}
          aria-label="Write a review"
          aria-hidden={!isExpanded}
          tabIndex={!isExpanded ? -1 : undefined}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Write a Review</span>
        </button>
      )}

      {state !== 'idle' && (
        <div className={styles.overlay}>
          <div ref={modalRef} className={styles.modal} role="dialog" aria-modal="true">
            {state === 'success' ? (
              <div className={styles.successContent}>
                <div className={styles.successIcon}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3 className={styles.successTitle}>Thank you for your review!</h3>
                <p className={styles.successText}>Your review helps other customers make informed decisions.</p>
              </div>
            ) : (
              <>
                <div className={styles.header}>
                  <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <h3 className={styles.headerTitle}>Write a Review</h3>
                  </div>
                  <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className={styles.body}>
                  {state === 'selectItem' && (
                    <>
                      <p className={styles.stepLabel}>Select an order to review:</p>
                      {itemsLoading ? (
                        <p className={styles.loadingText}>Loading your orders...</p>
                      ) : reviewableItems.length === 0 ? (
                        <div className={styles.emptyState}>
                          <p>No items to review right now.</p>
                          <p className={styles.emptyHint}>
                            Items from delivered orders that you haven&apos;t reviewed yet will appear here.
                          </p>
                        </div>
                      ) : (
                        <div className={styles.itemList}>
                          {reviewableItems.map((item) => (
                            <button
                              key={`${item.itemId}_${item.itemType}`}
                              className={styles.itemCard}
                              onClick={() => handleSelectItem(item)}
                            >
                              <div className={styles.itemImage}>
                                {item.image ? (
                                  <Image src={item.image} alt={item.name} width={48} height={48} />
                                ) : (
                                  <div className={styles.itemImagePlaceholder} />
                                )}
                              </div>
                              <div className={styles.itemInfo}>
                                <span className={styles.itemName}>{item.name}</span>
                                <span className={styles.itemMeta}>
                                  {item.itemType === 'DriftOff' ? 'Deep Rest' : item.itemType} ·{' '}
                                  {formatDate(item.orderDate)}
                                </span>
                              </div>
                              <svg
                                className={styles.chevron}
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {(state === 'writeReview' || state === 'submitting') && selectedItem && (
                    <>
                      <div className={styles.selectedProduct}>
                        <div className={styles.selectedProductLeft}>
                          {selectedItem.image && (
                            <Image
                              src={selectedItem.image}
                              alt={selectedItem.name}
                              width={40}
                              height={40}
                              className={styles.selectedProductImage}
                            />
                          )}
                          <div>
                            <span className={styles.selectedProductName}>{selectedItem.name}</span>
                            <span className={styles.selectedProductType}>
                              {selectedItem.itemType === 'DriftOff' ? 'Deep Rest' : selectedItem.itemType}
                            </span>
                          </div>
                        </div>
                        <button className={styles.changeButton} onClick={handleBack}>
                          Change
                        </button>
                      </div>

                      <p className={styles.ratingLabel}>How would you rate this product?</p>
                      <div className={styles.starRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            className={styles.starButton}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill={(hoverRating || rating) >= star ? 'var(--color-accent)' : 'none'}
                              stroke="var(--color-accent)"
                              strokeWidth="1.5"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </button>
                        ))}
                      </div>
                      <p className={styles.tapToRate}>Tap to rate</p>

                      <label className={styles.textareaLabel}>Share your experience with this product</label>
                      <textarea
                        className={styles.textarea}
                        placeholder="Tell us what you liked or didn't like about this product..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={1000}
                        rows={4}
                      />
                      <p className={styles.helperText}>Your review helps other customers make informed decisions.</p>
                    </>
                  )}
                </div>

                {(state === 'writeReview' || state === 'submitting') && (
                  <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={handleBack} disabled={state === 'submitting'}>
                      Back
                    </button>
                    <button
                      className={styles.submitButton}
                      onClick={handleSubmit}
                      disabled={rating === 0 || state === 'submitting'}
                    >
                      {state === 'submitting' ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
