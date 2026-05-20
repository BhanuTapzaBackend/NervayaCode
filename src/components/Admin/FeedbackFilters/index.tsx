'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AdminFeedbackFiltersParams } from '@/lib/api/adminFeedback';
import styles from '../FilterBar/styles.module.css';

export interface FeedbackFiltersProps {
  initialFilters?: AdminFeedbackFiltersParams;
  onApply: (filters: AdminFeedbackFiltersParams) => void;
  onReset: () => void;
  activeCount?: number;
}

function buildFilters(
  search: string,
  minScore: string,
  maxScore: string,
  dateFrom: string,
  dateTo: string,
): AdminFeedbackFiltersParams {
  const filters: AdminFeedbackFiltersParams = {};
  if (search) filters.search = search;
  const min = minScore ? Number(minScore) : undefined;
  const max = maxScore ? Number(maxScore) : undefined;
  if (min != null && !Number.isNaN(min)) filters.minScore = min;
  if (max != null && !Number.isNaN(max)) filters.maxScore = max;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;
  return filters;
}

export default function FeedbackFilters({
  initialFilters = {},
  onApply,
  onReset,
  activeCount = 0,
}: FeedbackFiltersProps) {
  const [search, setSearch] = useState(initialFilters.search ?? '');
  const [minScore, setMinScore] = useState(initialFilters.minScore?.toString() ?? '');
  const [maxScore, setMaxScore] = useState(initialFilters.maxScore?.toString() ?? '');
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(initialFilters.dateTo ?? '');
  const isFirstRender = useRef(true);
  const isResetting = useRef(false);

  const applyNow = useCallback(
    (s: string, mn: string, mx: string, df: string, dt: string) => {
      onApply(buildFilters(s, mn, mx, df, dt));
    },
    [onApply],
  );

  // Debounce text inputs
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
      applyNow(search, minScore, maxScore, dateFrom, dateTo);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, minScore, maxScore]);

  const handleChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    const s = setter === setSearch ? value : search;
    const mn = setter === setMinScore ? value : minScore;
    const mx = setter === setMaxScore ? value : maxScore;
    const df = setter === setDateFrom ? value : dateFrom;
    const dt = setter === setDateTo ? value : dateTo;
    // Instant apply for date fields
    if (setter === setDateFrom || setter === setDateTo) {
      applyNow(s, mn, mx, df, dt);
    }
  };

  const handleReset = useCallback(() => {
    isResetting.current = true;
    setSearch('');
    setMinScore('');
    setMaxScore('');
    setDateFrom('');
    setDateTo('');
    onReset();
  }, [onReset]);

  return (
    <div className={styles.bar} role="search" aria-label="Filter feedback">
      <div className={styles.field}>
        <label htmlFor="feedback-search">Search</label>
        <input
          id="feedback-search"
          type="text"
          placeholder="Name, email or phone"
          value={search}
          onChange={(e) => handleChange(setSearch, e.target.value)}
          aria-label="Search"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="feedback-min-score">Min Score</label>
        <input
          id="feedback-min-score"
          type="number"
          min={0}
          max={10}
          step={1}
          placeholder="0"
          value={minScore}
          onChange={(e) => handleChange(setMinScore, e.target.value)}
          aria-label="Minimum score"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="feedback-max-score">Max Score</label>
        <input
          id="feedback-max-score"
          type="number"
          min={0}
          max={10}
          step={1}
          placeholder="10"
          value={maxScore}
          onChange={(e) => handleChange(setMaxScore, e.target.value)}
          aria-label="Maximum score"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="feedback-date-from">Date From</label>
        <input
          id="feedback-date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => handleChange(setDateFrom, e.target.value)}
          aria-label="Date from"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="feedback-date-to">Date To</label>
        <input
          id="feedback-date-to"
          type="date"
          value={dateTo}
          onChange={(e) => handleChange(setDateTo, e.target.value)}
          aria-label="Date to"
        />
      </div>
      <div className={styles.actions}>
        {activeCount > 0 && <span className={styles.badge}>{activeCount} active</span>}
        <button type="button" onClick={handleReset} className={styles.resetButton}>
          Reset
        </button>
      </div>
    </div>
  );
}
