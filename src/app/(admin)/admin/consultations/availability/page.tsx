'use client';

import { useState, useCallback, useMemo } from 'react';
import PageHeader from '@/components/PageHeader/PageHeader';
import { StatusState, GlobalLoader } from '@/components/common';
import ConsultationAutoFill from '@/components/Admin/ConsultationAutoFill';
import ConsultationDayEditor from '@/components/Admin/ConsultationDayEditor';
import { useConsultationSchedule } from '@/queries/consultations/useConsultationSchedule';
import styles from './styles.module.css';

const WINDOW_DAYS = 90;
/** Below this much runway, the banner turns into a warning. */
const RUNWAY_WARNING_DAYS = 14;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoPlusDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Days of runway left before the public booking calendar runs dry. */
function daysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00Z`).getTime();
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - todayUtc) / 86_400_000);
}

export default function ConsultationAvailabilityPage() {
  const rangeStart = useMemo(() => todayIso(), []);
  const rangeEnd = useMemo(() => isoPlusDays(WINDOW_DAYS), []);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { schedules, generatedThrough, isLoading, error, refetch } = useConsultationSchedule(rangeStart, rangeEnd);

  const selectedDay = useMemo(
    () => schedules.find((day) => day.date === selectedDate) ?? null,
    [schedules, selectedDate],
  );

  const handleGenerated = useCallback(() => refetch(), [refetch]);

  const handleSaved = useCallback(() => {
    refetch();
    setSelectedDate(null);
  }, [refetch]);

  const runway = generatedThrough ? daysUntil(generatedThrough) : null;
  const runwayLow = runway !== null && runway <= RUNWAY_WARNING_DAYS;

  return (
    <div>
      <PageHeader
        title="Consultation Slots"
        subtitle="Control which days and times are offered for free 1-on-1 consultations."
      />

      {generatedThrough === null ? (
        <div className={styles.bannerWarn}>
          No availability has been generated yet. Until you generate some, the public booking form has no slots to
          offer.
        </div>
      ) : (
        <div className={runwayLow ? styles.bannerWarn : styles.banner}>
          Availability generated through {generatedThrough}
          {runway !== null && ` — ${runway} day${runway === 1 ? '' : 's'} left`}.
        </div>
      )}

      <ConsultationAutoFill onGenerated={handleGenerated} />

      {selectedDay && (
        <ConsultationDayEditor day={selectedDay} onSaved={handleSaved} onClose={() => setSelectedDate(null)} />
      )}

      <h2 className={styles.sectionTitle}>Next {WINDOW_DAYS} days</h2>

      {isLoading ? (
        <GlobalLoader label="Loading schedule..." />
      ) : error ? (
        <StatusState type="error" message={error} />
      ) : schedules.length === 0 ? (
        <StatusState type="empty" message="Nothing generated in this window yet." />
      ) : (
        <ul className={styles.dayList}>
          {schedules.map((day) => {
            const booked = day.slots.filter((slot) => slot.leadId !== null).length;
            const open = day.slots.filter((slot) => slot.isAvailable && slot.leadId === null).length;
            return (
              <li key={day.date}>
                <button
                  type="button"
                  className={styles.day}
                  onClick={() => setSelectedDate(day.date)}
                  aria-label={`Edit slots for ${day.date}`}
                >
                  <span className={styles.dayDate}>{day.date}</span>
                  <span className={styles.dayCounts}>
                    {open} open · {booked} booked
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
