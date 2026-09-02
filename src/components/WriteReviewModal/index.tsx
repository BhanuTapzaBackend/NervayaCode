'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useFloatingActions } from '@/context/FloatingActionsContext';
import { ROLES } from '@/lib/constants/roles';
import { reviewsApi, type ReviewableItem } from '@/lib/api/reviews';
import { useReviewableItems } from '@/queries/reviews/useReviewableItems';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { ItemPicker } from './ItemPicker';
import { OPEN_REVIEW_MODAL_EVENT, notifyReviewableItemsUpdated, type OpenReviewModalDetail } from '@/constants/events';
import { toast } from 'sonner';
import Image from 'next/image';
import styles from './styles.module.css';
import { trackReviewSubmitted } from '@/utils/analytics';

type ModalState = 'idle' | 'selectItem' | 'writeReview' | 'submitting' | 'success';

export function WriteReviewModal() {
  const { user } = useAuthContext();
  const { isExpanded, registerButton } = useFloatingActions();
  const [state, setState] = useState<ModalState>('idle');
  // When opened from an order card or a product page, the picker shows only
  // those items; a single match skips the picker entirely.
  const [filterItemIds, setFilterItemIds] = useState<string[] | null>(null);
  // Product-page opens jump straight to the form with no picker to go back to.
  const [directOpen, setDirectOpen] = useState(false);
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

  const handleOpen = useCallback(
    async (detail?: OpenReviewModalDetail) => {
      setRating(0);
      setHoverRating(0);
      setComment('');

      // Direct product review (Amazon-style, no purchase required): straight to
      // the form — the picker never enters the picture.
      if (detail?.item) {
        setDirectOpen(true);
        setFilterItemIds(null);
        setSelectedItem({ ...detail.item, orderId: '', orderDate: new Date().toISOString() });
        setState('writeReview');
        return;
      }

      const scoped = detail?.itemIds && detail.itemIds.length > 0 ? detail.itemIds : null;
      setDirectOpen(false);
      setState('selectItem');
      setFilterItemIds(scoped);
      setSelectedItem(null);
      const items = await refetch();
      if (!scoped) return;
      // A scoped open (an order with one reviewable item) skips the picker. The
      // functional update keeps a modal the user has already closed from
      // reopening once the fetch lands.
      const matches = items.filter((item) => scoped.includes(item.itemId));
      if (matches.length === 1) {
        setSelectedItem(matches[0]);
        setState((current) => (current === 'selectItem' ? 'writeReview' : current));
      }
    },
    [refetch],
  );

  // "Rate & Review" buttons live far from this modal (mounted once in
  // Providers), so they open it through the open-review-modal DOM event.
  useEffect(() => {
    const onOpenRequest = (event: Event): void => {
      void handleOpen((event as CustomEvent<OpenReviewModalDetail>).detail);
    };
    window.addEventListener(OPEN_REVIEW_MODAL_EVENT, onOpenRequest);
    return () => window.removeEventListener(OPEN_REVIEW_MODAL_EVENT, onOpenRequest);
  }, [handleOpen]);

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
      notifyReviewableItemsUpdated();
      setTimeout(() => setState('idle'), 2000);
    } catch {
      toast.error('Failed to submit review. Please try again.');
      setState('writeReview');
    }
  }, [selectedItem, rating, comment]);

  if (!isCustomer) return null;

  const visibleItems = filterItemIds
    ? reviewableItems.filter((item) => filterItemIds.includes(item.itemId))
    : reviewableItems;

  return (
    <>
      {showFloatingButton && (
        <button
          className={`${styles.floatingButton} ${!isExpanded ? styles.collapsed : ''}`}
          onClick={() => void handleOpen()}
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
                <p className={styles.successText}>
                  Your review has been submitted and will appear once it&apos;s approved by our team.
                </p>
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
                    <ItemPicker
                      items={visibleItems}
                      isLoading={itemsLoading}
                      isScoped={filterItemIds !== null}
                      onSelect={handleSelectItem}
                    />
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
                        {!directOpen && (
                          <button className={styles.changeButton} onClick={handleBack}>
                            Change
                          </button>
                        )}
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
                    <button
                      className={styles.cancelButton}
                      onClick={directOpen ? handleClose : handleBack}
                      disabled={state === 'submitting'}
                    >
                      {directOpen ? 'Cancel' : 'Back'}
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
