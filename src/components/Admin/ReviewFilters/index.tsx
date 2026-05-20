'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AdminReviewFiltersParams } from '@/lib/api/adminReviews';
import styles from '../FilterBar/styles.module.css';

const RATING_OPTIONS = [
  { value: '', label: 'All ratings' },
  { value: '1', label: '1 Star' },
  { value: '2', label: '2 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '5', label: '5 Stars' },
];

const VISIBILITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Visible' },
  { value: 'false', label: 'Hidden' },
];

const ITEM_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'Supplement', label: 'Supplement' },
  { value: 'DriftOff', label: 'Deep Rest' },
  { value: 'Therapy', label: 'Therapy' },
];

export interface ReviewFiltersProps {
  initialFilters?: AdminReviewFiltersParams;
  onApply: (filters: AdminReviewFiltersParams) => void;
  onReset: () => void;
  activeCount?: number;
}

function buildFilters(
  search: string,
  rating: string,
  visibility: string,
  itemType: string,
  dateFrom: string,
  dateTo: string,
): AdminReviewFiltersParams {
  const filters: AdminReviewFiltersParams = {};
  if (search) filters.search = search;
  if (rating) filters.rating = Number(rating);
  if (visibility) filters.isVisible = visibility === 'true';
  if (itemType) filters.itemType = itemType;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;
  return filters;
}

export default function ReviewFilters({ initialFilters = {}, onApply, onReset, activeCount = 0 }: ReviewFiltersProps) {
  const [search, setSearch] = useState(initialFilters.search ?? '');
  const [rating, setRating] = useState(initialFilters.rating?.toString() ?? '');
  const [visibility, setVisibility] = useState(
    initialFilters.isVisible !== undefined ? String(initialFilters.isVisible) : '',
  );
  const [itemType, setItemType] = useState(initialFilters.itemType ?? '');
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(initialFilters.dateTo ?? '');
  const isFirstRender = useRef(true);
  const isResetting = useRef(false);

  // Auto-apply on dropdown/date changes (instant)
  const applyNow = useCallback(
    (s: string, r: string, v: string, it: string, df: string, dt: string) => {
      onApply(buildFilters(s, r, v, it, df, dt));
    },
    [onApply],
  );

  // Debounce search input (300ms)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isResetting.current) {
      isResetting.current = false;
      return;
    }
    const timer = setTimeout(() => {
      applyNow(search, rating, visibility, itemType, dateFrom, dateTo);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSelectChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    // Use the new value directly since setState is async
    const s = setter === setSearch ? value : search;
    const r = setter === setRating ? value : rating;
    const v = setter === setVisibility ? value : visibility;
    const it = setter === setItemType ? value : itemType;
    const df = setter === setDateFrom ? value : dateFrom;
    const dt = setter === setDateTo ? value : dateTo;
    applyNow(s, r, v, it, df, dt);
  };

  const handleReset = useCallback(() => {
    isResetting.current = true;
    setSearch('');
    setRating('');
    setVisibility('');
    setItemType('');
    setDateFrom('');
    setDateTo('');
    onReset();
  }, [onReset]);

  return (
    <div className={styles.bar} role="search" aria-label="Filter reviews">
      <div className={styles.field}>
        <label htmlFor="review-search">Search</label>
        <input
          id="review-search"
          type="text"
          placeholder="Name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="review-item-type">Type</label>
        <select
          id="review-item-type"
          value={itemType}
          onChange={(e) => handleSelectChange(setItemType, e.target.value)}
          aria-label="Item type"
        >
          {ITEM_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="review-rating">Rating</label>
        <select
          id="review-rating"
          value={rating}
          onChange={(e) => handleSelectChange(setRating, e.target.value)}
          aria-label="Rating"
        >
          {RATING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="review-visibility">Visibility</label>
        <select
          id="review-visibility"
          value={visibility}
          onChange={(e) => handleSelectChange(setVisibility, e.target.value)}
          aria-label="Visibility"
        >
          {VISIBILITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="review-date-from">Date from</label>
        <input
          id="review-date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => handleSelectChange(setDateFrom, e.target.value)}
          aria-label="Date from"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="review-date-to">Date to</label>
        <input
          id="review-date-to"
          type="date"
          value={dateTo}
          onChange={(e) => handleSelectChange(setDateTo, e.target.value)}
          aria-label="Date to"
        />
      </div>
      <div className={styles.actions}>
        {activeCount > 0 && <span className={styles.badge}>{activeCount} filter(s) active</span>}
        <button type="button" onClick={handleReset} className={styles.resetButton}>
          Reset
        </button>
      </div>
    </div>
  );
}
