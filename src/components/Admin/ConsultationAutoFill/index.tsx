'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/common';
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
        <label className={styles.field}>
          <span>From</span>
          <input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} />
        </label>

        <label className={styles.field}>
          <span>To</span>
          <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} />
        </label>

        <label className={styles.field}>
          <span>Start time</span>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </label>

        <label className={styles.field}>
          <span>End time</span>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </label>

        <label className={styles.field}>
          <span>Slot length</span>
          <select value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))}>
            {SLOT_LENGTHS.map((length) => (
              <option key={length} value={length}>
                {length} minutes
              </option>
            ))}
          </select>
        </label>
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
