'use client';

import { DAYS_OF_WEEK } from '@/lib/constants/consultingHours.constants';
import type { ConsultingHour } from '@/types/therapist.types';
import styles from './styles.module.css';

interface WeekSummaryProps {
  consultingHours: ConsultingHour[];
}

export function WeekSummary({ consultingHours }: WeekSummaryProps) {
  const hasEnabledDays = consultingHours.some((h) => h.isEnabled);
  if (!hasEnabledDays) return null;

  return (
    <div className={styles.weekSummary}>
      <h5 className={styles.summaryTitle}>Quick Preview</h5>
      <div className={styles.summaryGrid}>
        {DAYS_OF_WEEK.map((day) => {
          const dayHours = consultingHours.find((h) => h.dayOfWeek === day.value);
          return (
            <div
              key={day.value}
              className={`${styles.summaryDay} ${dayHours?.isEnabled ? styles.summaryDayEnabled : ''}`}
            >
              <div className={styles.summaryDayName}>{day.short}</div>
              {dayHours?.isEnabled ? (
                <div className={styles.summaryTime}>
                  {dayHours.startTime} - {dayHours.endTime}
                </div>
              ) : (
                <div className={styles.summaryTimeDisabled}>Closed</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
