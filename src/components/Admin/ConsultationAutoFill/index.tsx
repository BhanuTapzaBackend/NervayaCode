'use client';

import { useState, useCallback } from 'react';
import { Button, Select, DateField } from '@/components/common';
import { consultationsApi } from '@/lib/api/consultations';
import styles from './styles.module.css';

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const SLOT_LENGTHS = [15, 30, 45, 60];

export interface ConsultationAutoFillProps {
  onGenerated: () => void;
}

export default function ConsultationAutoFill({ onGenerated }: ConsultationAutoFillProps) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleWeekday = useCallback((day: number) => {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }, []);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (!fromDate || !toDate) {
      setError('Pick a start and end date.');
      return;
    }
    if (weekdays.length === 0) {
      setError('Select at least one weekday.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await consultationsApi.generate({ fromDate, toDate, startTime, endTime, slotMinutes, weekdays });
      if (response.success) {
        setSuccess(response.message ?? 'Slots generated.');
        onGenerated();
      } else {
        setError(response.message ?? 'Could not generate slots.');
      }
    } catch {
      setError('Could not generate slots. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [fromDate, toDate, startTime, endTime, slotMinutes, weekdays, onGenerated]);

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>Auto-fill availability</h2>
      <p className={styles.subtitle}>
        Generate slots across a date range. Existing bookings are always kept — re-running this never cancels anyone.
      </p>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="autofill-from">From</label>
          <DateField
            id="autofill-from"
            value={fromDate}
            max={toDate || undefined}
            placeholder="Start date"
            ariaLabel="Generate from date"
            onChange={setFromDate}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="autofill-to">To</label>
          <DateField
            id="autofill-to"
            value={toDate}
            min={fromDate || undefined}
            placeholder="End date"
            ariaLabel="Generate to date"
            onChange={setToDate}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="autofill-start-time">Start time</label>
          <input
            id="autofill-start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="autofill-end-time">End time</label>
          <input id="autofill-end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label htmlFor="autofill-slot-length">Slot length</label>
          <Select
            id="autofill-slot-length"
            options={SLOT_LENGTHS.map((length) => ({ value: String(length), label: `${length} minutes` }))}
            value={String(slotMinutes)}
            onChange={(v) => setSlotMinutes(Number(v))}
            ariaLabel="Slot length"
          />
        </div>
      </div>

      <fieldset className={styles.weekdays}>
        <legend>Days to include</legend>
        {WEEKDAYS.map((day) => (
          <label key={day.value} className={styles.weekday}>
            <input type="checkbox" checked={weekdays.includes(day.value)} onChange={() => toggleWeekday(day.value)} />
            {day.label}
          </label>
        ))}
      </fieldset>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <Button variant="primary" onClick={handleGenerate} disabled={isSubmitting}>
        {isSubmitting ? 'Generating...' : 'Generate slots'}
      </Button>
    </section>
  );
}
