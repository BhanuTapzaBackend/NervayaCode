/**
 * Cross-component DOM events (the `auth-state-changed` pattern): the review
 * modal is mounted once in Providers, so pages that want to open it — the
 * "Rate & Review" button on an order card, "Write a Review" on a product page —
 * dispatch this instead of prop-drilling.
 */
export const OPEN_REVIEW_MODAL_EVENT = 'open-review-modal';

/** Fired after a review is submitted so item lists and review tabs refetch. */
export const REVIEWABLE_ITEMS_UPDATED_EVENT = 'reviewable-items-updated';

/** A product to review directly, bypassing the purchased-items picker. */
export interface ReviewTarget {
  itemId: string;
  itemType: string;
  name: string;
  image: string;
}

export interface OpenReviewModalDetail {
  /**
   * Limit the picker to these product/item ids — an order's items. Ids rather
   * than an order id because the reviewable list dedupes repeat purchases onto
   * the newest order, so an older order's id can legitimately match nothing.
   */
  itemIds?: string[];
  /**
   * Open the form directly for this product (Amazon-style: no purchase
   * required — the create API only needs a signed-in customer, and a repeat
   * submission updates the user's existing review).
   */
  item?: ReviewTarget;
}

export function openReviewModal(itemIds?: string[]): void {
  window.dispatchEvent(new CustomEvent<OpenReviewModalDetail>(OPEN_REVIEW_MODAL_EVENT, { detail: { itemIds } }));
}

export function openReviewModalForItem(item: ReviewTarget): void {
  window.dispatchEvent(new CustomEvent<OpenReviewModalDetail>(OPEN_REVIEW_MODAL_EVENT, { detail: { item } }));
}

export function notifyReviewableItemsUpdated(): void {
  window.dispatchEvent(new Event(REVIEWABLE_ITEMS_UPDATED_EVENT));
}
