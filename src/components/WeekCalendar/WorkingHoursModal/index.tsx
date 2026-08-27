'use client';

import { Icon } from '@iconify/react';

import Modal from '@/components/common/Modal/Modal';
import { Select } from '@/components/common/Select/Select';
import { ICON_ALERT } from '@/constants/icons';
import type { ConsultingHour } from '@/types/therapist.types';
import { TIME_OPTIONS, normalizeToOption, toMinutes } from './timeOptions';
import styles from './styles.module.css';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface WorkingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultingHours: ConsultingHour[];
  onToggleDay: (dayOfWeek: number) => void;
  onUpdateDay: (dayOfWeek: number, patch: { startTime?: string; endTime?: string }) => void;
  onSave: () => void;
  saving: boolean;
  hasEnabledDays: boolean;
  error?: string | null;
}

/**
 * Working hours editor, in a modal.
 *
 * It used to live inline in the calendar sidebar, where a ~240px column had to
 * hold a checkbox, a day name, two time fields and a separator — so the times
 * clipped mid-value ("05:00" with the AM/PM cut off) and the calendar lost
 * width to a panel most therapists touch rarely. A modal gives it room and
 * gives the grid its space back.
 */
export function WorkingHoursModal({
  isOpen,
  onClose,
  consultingHours,
  onToggleDay,
  onUpdateDay,
  onSave,
  saving,
  hasEnabledDays,
  error,
}: WorkingHoursModalProps) {
  // A day whose end is at or before its start would generate zero slots and
  // silently look like nothing happened, so block saving and say which day.
  const invalidDays = consultingHours.filter(
    (hour) => hour.isEnabled && toMinutes(hour.endTime) <= toMinutes(hour.startTime),
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Working hours">
      <div className={styles.body}>
        <p className={styles.intro}>
          Pick the hours you can be booked on each day. Bookable slots are regenerated when you save.
        </p>

        <div className={styles.days}>
          {consultingHours.map((hour) => (
            <div key={hour.dayOfWeek} className={`${styles.row} ${hour.isEnabled ? styles.rowOpen : ''}`}>
              <label className={styles.dayToggle}>
                <input
                  type="checkbox"
                  checked={hour.isEnabled}
                  onChange={() => onToggleDay(hour.dayOfWeek)}
                  className={styles.checkbox}
                />
                <span className={styles.dayName}>{DAY_NAMES[hour.dayOfWeek]}</span>
              </label>

              {hour.isEnabled ? (
                <div className={styles.times}>
                  <Select
                    options={TIME_OPTIONS}
                    value={normalizeToOption(hour.startTime)}
                    onChange={(value) => onUpdateDay(hour.dayOfWeek, { startTime: value })}
                    ariaLabel={`${DAY_NAMES[hour.dayOfWeek]} start time`}
                    className={styles.timeSelect}
                  />
                  <span className={styles.dash} aria-hidden="true">
                    –
                  </span>
                  <Select
                    options={TIME_OPTIONS}
                    value={normalizeToOption(hour.endTime)}
                    onChange={(value) => onUpdateDay(hour.dayOfWeek, { endTime: value })}
                    ariaLabel={`${DAY_NAMES[hour.dayOfWeek]} end time`}
                    className={styles.timeSelect}
                  />
                </div>
              ) : (
                <span className={styles.closed}>Closed</span>
              )}
            </div>
          ))}
        </div>

        {invalidDays.length > 0 && (
          <p className={styles.warning} role="alert">
            <Icon icon={ICON_ALERT} width={16} height={16} aria-hidden="true" />
            {invalidDays.map((d) => DAY_NAMES[d.dayOfWeek]).join(', ')} end at or before the start time.
          </p>
        )}

        {!hasEnabledDays && (
          <p className={styles.warning} role="alert">
            <Icon icon={ICON_ALERT} width={16} height={16} aria-hidden="true" />
            Every day is closed, so you cannot be booked at all.
          </p>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.save}
            onClick={onSave}
            disabled={saving || invalidDays.length > 0 || !hasEnabledDays}
          >
            {saving ? 'Saving…' : 'Save and update slots'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default WorkingHoursModal;
