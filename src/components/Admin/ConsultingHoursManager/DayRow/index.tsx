'use client';

import { convert12To24, convert24To12 } from '@/lib/utils/time.util';
import type { ConsultingHour } from '@/types/therapist.types';
import styles from './styles.module.css';

interface DayRowProps {
  dayLabel: string;
  dayHours: ConsultingHour;
  onToggle: () => void;
  onUpdate: (updates: Partial<ConsultingHour>) => void;
}

export function DayRow({ dayLabel, dayHours, onToggle, onUpdate }: DayRowProps) {
  return (
    <div className={`${styles.dayCard} ${dayHours.isEnabled ? styles.enabled : ''}`}>
      <div className={styles.dayHeader}>
        <label className={styles.dayToggle}>
          <input type="checkbox" checked={dayHours.isEnabled} onChange={onToggle} />
          <span className={styles.dayLabel}>{dayLabel}</span>
        </label>
      </div>
      {dayHours.isEnabled && (
        <div className={styles.timeInputs}>
          <label className={styles.timeLabel}>
            Start Time
            <input
              type="time"
              value={convert12To24(dayHours.startTime)}
              onChange={(e) => onUpdate({ startTime: convert24To12(e.target.value) })}
              className={styles.timeInput}
            />
          </label>
          <span className={styles.timeSeparator}>to</span>
          <label className={styles.timeLabel}>
            End Time
            <input
              type="time"
              value={convert12To24(dayHours.endTime)}
              onChange={(e) => onUpdate({ endTime: convert24To12(e.target.value) })}
              className={styles.timeInput}
            />
          </label>
        </div>
      )}
    </div>
  );
}
