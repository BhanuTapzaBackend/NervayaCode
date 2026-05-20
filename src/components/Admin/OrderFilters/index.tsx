'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { OrderFiltersParams } from '@/lib/api/orders';
import { Dropdown } from '@/components/common';
import styles from '../FilterBar/styles.module.css';

const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const DEBOUNCE_MS = 400;

function buildFilters(
  orderStatus: string,
  paymentStatus: string,
  dateFrom: string,
  dateTo: string,
  minAmount: string,
  maxAmount: string,
  userId: string,
): OrderFiltersParams {
  const filters: OrderFiltersParams = {};
  if (orderStatus) filters.orderStatus = orderStatus;
  if (paymentStatus) filters.paymentStatus = paymentStatus;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;
  const min = minAmount ? Number(minAmount) : undefined;
  const max = maxAmount ? Number(maxAmount) : undefined;
  if (min != null && !Number.isNaN(min)) filters.minAmount = min;
  if (max != null && !Number.isNaN(max)) filters.maxAmount = max;
  if (userId.trim()) filters.userId = userId.trim();
  return filters;
}

export interface OrderFiltersProps {
  initialFilters?: OrderFiltersParams;
  onApply: (filters: OrderFiltersParams) => void;
  onReset: () => void;
  activeCount?: number;
}

export default function OrderFilters({ initialFilters = {}, onApply, onReset, activeCount = 0 }: OrderFiltersProps) {
  const [orderStatus, setOrderStatus] = useState(initialFilters.orderStatus ?? '');
  const [paymentStatus, setPaymentStatus] = useState(initialFilters.paymentStatus ?? '');
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(initialFilters.dateTo ?? '');
  const [minAmount, setMinAmount] = useState(initialFilters.minAmount?.toString() ?? '');
  const [maxAmount, setMaxAmount] = useState(initialFilters.maxAmount?.toString() ?? '');
  const [userId, setUserId] = useState(initialFilters.userId ?? '');
  const isFirstRender = useRef(true);
  const isResetting = useRef(false);

  const applyNow = useCallback(
    (os: string, ps: string, df: string, dt: string, mn: string, mx: string, uid: string) => {
      onApply(buildFilters(os, ps, df, dt, mn, mx, uid));
    },
    [onApply],
  );

  // Debounce text/number inputs
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
      applyNow(orderStatus, paymentStatus, dateFrom, dateTo, minAmount, maxAmount, userId);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minAmount, maxAmount, userId]);

  // Instant apply for dropdowns and dates
  const handleInstantChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    const os = setter === setOrderStatus ? value : orderStatus;
    const ps = setter === setPaymentStatus ? value : paymentStatus;
    const df = setter === setDateFrom ? value : dateFrom;
    const dt = setter === setDateTo ? value : dateTo;
    applyNow(os, ps, df, dt, minAmount, maxAmount, userId);
  };

  const handleReset = useCallback(() => {
    isResetting.current = true;
    setOrderStatus('');
    setPaymentStatus('');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setUserId('');
    onReset();
  }, [onReset]);

  return (
    <div className={styles.bar} role="search" aria-label="Filter orders">
      <div className={styles.field}>
        <label htmlFor="order-status">Order status</label>
        <Dropdown
          id="order-status"
          options={ORDER_STATUS_OPTIONS}
          value={orderStatus}
          onChange={(v) => handleInstantChange(setOrderStatus, v)}
          ariaLabel="Order status"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="payment-status">Payment status</label>
        <Dropdown
          id="payment-status"
          options={PAYMENT_STATUS_OPTIONS}
          value={paymentStatus}
          onChange={(v) => handleInstantChange(setPaymentStatus, v)}
          ariaLabel="Payment status"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="order-date-from">Date from</label>
        <input
          id="order-date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => handleInstantChange(setDateFrom, e.target.value)}
          aria-label="Date from"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="order-date-to">Date to</label>
        <input
          id="order-date-to"
          type="date"
          value={dateTo}
          onChange={(e) => handleInstantChange(setDateTo, e.target.value)}
          aria-label="Date to"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="order-min-amount">Min amount</label>
        <input
          id="order-min-amount"
          type="number"
          min={0}
          step={1}
          placeholder="Min"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          aria-label="Minimum amount"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="order-max-amount">Max amount</label>
        <input
          id="order-max-amount"
          type="number"
          min={0}
          step={1}
          placeholder="Max"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          aria-label="Maximum amount"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="order-user-id">User ID</label>
        <input
          id="order-user-id"
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          aria-label="User ID"
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
