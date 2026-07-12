'use client';

import { useState, useCallback } from 'react';
import { Select, DateField } from '@/components/common';
import type { ConsultationFiltersParams } from '@/types/consultation.types';
import styles from '../FilterBar/styles.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export interface ConsultationFiltersProps {
  initialFilters?: ConsultationFiltersParams;
  onApply: (filters: ConsultationFiltersParams) => void;
  onReset: () => void;
  activeCount?: number;
}

function buildFilters(status: string, dateFrom: string, dateTo: string): ConsultationFiltersParams {
  const filters: ConsultationFiltersParams = {};
  if (status) filters.status = status;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;
  return filters;
}

export default function ConsultationFilters({
  initialFilters = {},
  onApply,
  onReset,
  activeCount = 0,
}: ConsultationFiltersProps) {
  const [status, setStatus] = useState(initialFilters.status ?? '');
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(initialFilters.dateTo ?? '');

  // Filters apply instantly — there is no free-text field to debounce.
  const applyNow = useCallback(
    (nextStatus: string, nextFrom: string, nextTo: string) => {
      onApply(buildFilters(nextStatus, nextFrom, nextTo));
    },
    [onApply],
  );

  const handleReset = useCallback(() => {
    setStatus('');
    setDateFrom('');
    setDateTo('');
    onReset();
  }, [onReset]);

  return (
    <div className={styles.bar} role="search" aria-label="Filter consultations">
      <div className={styles.field}>
        <label htmlFor="consultation-status">Status</label>
        <Select
          id="consultation-status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus(v);
            applyNow(v, dateFrom, dateTo);
          }}
          ariaLabel="Consultation status"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="consultation-date-from">From</label>
        <DateField
          id="consultation-date-from"
          value={dateFrom}
          max={dateTo || undefined}
          placeholder="Any date"
          ariaLabel="Bookings from date"
          onChange={(v) => {
            setDateFrom(v);
            applyNow(status, v, dateTo);
          }}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="consultation-date-to">To</label>
        <DateField
          id="consultation-date-to"
          value={dateTo}
          min={dateFrom || undefined}
          placeholder="Any date"
          ariaLabel="Bookings to date"
          onChange={(v) => {
            setDateTo(v);
            applyNow(status, dateFrom, v);
          }}
        />
      </div>

      <div className={styles.actions}>
        {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
        <button type="button" className={styles.resetButton} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
