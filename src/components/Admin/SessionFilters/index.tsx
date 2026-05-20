'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { therapistsApi } from '@/lib/api/therapists';
import type { SessionFiltersParams } from '@/lib/api/sessions';
import type { Therapist } from '@/types/therapist.types';
import { Dropdown } from '@/components/common';
import styles from '../FilterBar/styles.module.css';

const SESSION_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DEBOUNCE_MS = 400;

function buildFilters(
  status: string,
  therapistId: string,
  dateFrom: string,
  dateTo: string,
  search: string,
): SessionFiltersParams {
  const filters: SessionFiltersParams = {};
  if (status) filters.status = status;
  if (therapistId) filters.therapistId = therapistId;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;
  if (search.trim()) filters.search = search.trim();
  return filters;
}

export interface SessionFiltersProps {
  initialFilters?: SessionFiltersParams;
  onApply: (filters: SessionFiltersParams) => void;
  onReset: () => void;
  activeCount?: number;
}

export default function SessionFilters({
  initialFilters = {},
  onApply,
  onReset,
  activeCount = 0,
}: SessionFiltersProps) {
  const [status, setStatus] = useState(initialFilters.status ?? '');
  const [therapistId, setTherapistId] = useState(initialFilters.therapistId ?? '');
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(initialFilters.dateTo ?? '');
  const [search, setSearch] = useState(initialFilters.search ?? '');
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const isFirstRender = useRef(true);
  const isResetting = useRef(false);

  useEffect(() => {
    let active = true;
    therapistsApi
      .getAll()
      .then((res) => {
        if (active && res.success && Array.isArray(res.data)) setTherapists(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const applyNow = useCallback(
    (st: string, tid: string, df: string, dt: string, s: string) => {
      onApply(buildFilters(st, tid, df, dt, s));
    },
    [onApply],
  );

  // Debounce search text input
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
      applyNow(status, therapistId, dateFrom, dateTo, search);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Instant apply for dropdowns and dates
  const handleInstantChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    const st = setter === setStatus ? value : status;
    const tid = setter === setTherapistId ? value : therapistId;
    const df = setter === setDateFrom ? value : dateFrom;
    const dt = setter === setDateTo ? value : dateTo;
    applyNow(st, tid, df, dt, search);
  };

  const handleReset = useCallback(() => {
    isResetting.current = true;
    setStatus('');
    setTherapistId('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    onReset();
  }, [onReset]);

  return (
    <div className={styles.bar} role="search" aria-label="Filter sessions">
      <div className={styles.field}>
        <label htmlFor="session-status">Status</label>
        <Dropdown
          id="session-status"
          options={SESSION_STATUS_OPTIONS}
          value={status}
          onChange={(v) => handleInstantChange(setStatus, v)}
          ariaLabel="Session status"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="session-therapist">Therapist</label>
        <Dropdown
          id="session-therapist"
          options={[
            { value: '', label: 'All therapists' },
            ...therapists.map((t) => ({ value: t._id, label: t.name })),
          ]}
          value={therapistId}
          onChange={(v) => handleInstantChange(setTherapistId, v)}
          ariaLabel="Therapist"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="session-date-from">Date from</label>
        <input
          id="session-date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => handleInstantChange(setDateFrom, e.target.value)}
          aria-label="Date from"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="session-date-to">Date to</label>
        <input
          id="session-date-to"
          type="date"
          value={dateTo}
          onChange={(e) => handleInstantChange(setDateTo, e.target.value)}
          aria-label="Date to"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="session-search">User</label>
        <input
          id="session-search"
          type="text"
          placeholder="Name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search by user name or email"
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
