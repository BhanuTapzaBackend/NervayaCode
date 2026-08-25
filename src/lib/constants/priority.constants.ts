/**
 * Admin-controlled display ordering for therapists and blogs.
 *
 * Lower number wins: priority 1 shows first. Items the admin has not numbered
 * are stored as `UNPRIORITIZED` — a sentinel large enough to sort after every
 * real priority — so a plain `sort({ priority: 1, createdAt: -1 })` puts
 * numbered items first and leaves the rest newest-first. Storing a sentinel
 * rather than `null` matters: MongoDB sorts null/missing values FIRST in
 * ascending order, which would put un-numbered items at the top.
 */
export const UNPRIORITIZED = 999999;

/** Highest number an admin may type. Keeps the value clear of the sentinel. */
export const MAX_PRIORITY = 9999;

/**
 * Coerces admin input into a storable priority.
 * Empty input, junk, and out-of-range values all mean "not prioritized".
 */
export function normalizePriority(value: unknown): number {
  if (value === null || value === undefined || value === '') return UNPRIORITIZED;

  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed)) return UNPRIORITIZED;

  const rounded = Math.trunc(parsed);
  if (rounded < 1 || rounded > MAX_PRIORITY) return UNPRIORITIZED;

  return rounded;
}

/** True when this item has no admin-assigned position. */
export function isUnprioritized(value: number | null | undefined): boolean {
  return value === null || value === undefined || value >= UNPRIORITIZED;
}

/** The value to show in an admin input: the number, or empty when unset. */
export function priorityInputValue(value: number | null | undefined): string {
  return isUnprioritized(value) ? '' : String(value);
}
