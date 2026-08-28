'use client';

import { useCallback, useRef, useState } from 'react';
import { Icon } from '@iconify/react';

import Modal from '@/components/common/Modal/Modal';
import { Select } from '@/components/common/Select/Select';
import { ICON_ALERT } from '@/constants/icons';
import type { ConsultingHour } from '@/types/therapist.types';
import { END_TIME_OPTIONS, TIME_OPTIONS, normalizeToOption, toMinutes } from './timeOptions';
import styles from './styles.module.css';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface WorkingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultingHours: ConsultingHour[];
  onSave: (hours: ConsultingHour[]) => void;
  saving: boolean;
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
 *
 * Edits are held in a LOCAL draft and handed to `onSave` only on Save. They
 * used to be written straight into the parent's shared state, which meant
 * Cancel discarded nothing: the edits were already live, and closing the modal
 * re-armed the sidebar's debounced auto-save, which then persisted the very
 * changes the therapist had just backed out of.
 *
 * `Modal` renders nothing while closed, so the form below mounts fresh on each
 * opening — which is what seeds the draft, with no effect and no reset logic.
 */
export function WorkingHoursModal({ isOpen, onClose, consultingHours, onSave, saving, error }: WorkingHoursModalProps) {
  // The draft lives inside the form and dies with it, so every dismissal path —
  // backdrop, Escape, the X, Cancel — is unrecoverable. The form reports whether
  // it is dirty so those paths can ask first.
  const dirtyRef = useRef(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const requestClose = useCallback(() => {
    if (dirtyRef.current) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  }, [onClose]);

  const discard = useCallback(() => {
    setConfirmingDiscard(false);
    dirtyRef.current = false;
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={requestClose} title="Working hours">
      {/* The form stays MOUNTED behind the prompt. Swapping it out would unmount
          it, which is exactly the draft loss the prompt exists to prevent. */}
      <WorkingHoursForm
        initialHours={consultingHours}
        onCancel={requestClose}
        onSave={onSave}
        onDirtyChange={(dirty) => {
          dirtyRef.current = dirty;
        }}
        saving={saving}
        error={error}
      />

      {confirmingDiscard && (
        <div className={styles.discardBar} role="alertdialog" aria-label="Unsaved changes">
          <span className={styles.discardText}>You have unsaved changes to your working hours.</span>
          <div className={styles.discardActions}>
            <button type="button" className={styles.cancel} onClick={() => setConfirmingDiscard(false)}>
              Keep editing
            </button>
            <button type="button" className={styles.discardConfirm} onClick={discard}>
              Discard
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

interface WorkingHoursFormProps {
  initialHours: ConsultingHour[];
  onCancel: () => void;
  onSave: (hours: ConsultingHour[]) => void;
  /** Reports whether the draft still matches what was loaded. */
  onDirtyChange: (dirty: boolean) => void;
  saving: boolean;
  error?: string | null;
}

function WorkingHoursForm({ initialHours, onCancel, onSave, onDirtyChange, saving, error }: WorkingHoursFormProps) {
  // Snap onto the half-hour grid AS THE DRAFT, not just for display. Values off
  // the grid render as the nearest option, so normalising only on render showed
  // "9:00 AM" for a stored "09:15 AM" and then saved 09:15 straight back.
  const [seeded] = useState<ConsultingHour[]>(() =>
    initialHours.map((hour) => ({
      ...hour,
      startTime: normalizeToOption(hour.startTime, 'start'),
      endTime: normalizeToOption(hour.endTime, 'end'),
    })),
  );
  const [draft, setDraft] = useState<ConsultingHour[]>(seeded);

  const serialise = (hours: ConsultingHour[]) =>
    hours.map((h) => `${h.dayOfWeek}:${h.isEnabled ? `${h.startTime}-${h.endTime}` : 'off'}`).join('|');

  const updateDay = (dayOfWeek: number, patch: Partial<ConsultingHour>) => {
    setDraft((prev) => {
      const next = prev.map((hour) => (hour.dayOfWeek === dayOfWeek ? { ...hour, ...patch } : hour));
      // Compared against the SEEDED draft, not the raw prop: seeding snaps times
      // onto the half-hour grid, so comparing with the raw values would report
      // dirty before the therapist touched anything.
      onDirtyChange(serialise(next) !== serialise(seeded));
      return next;
    });
  };

  // A day whose end is at or before its start would generate zero slots and
  // silently look like nothing happened, so block saving and say which day.
  const invalidDays = draft.filter((hour) => hour.isEnabled && toMinutes(hour.endTime) <= toMinutes(hour.startTime));
  const hasEnabledDays = draft.some((hour) => hour.isEnabled);

  return (
    <div className={styles.body}>
      <p className={styles.intro}>
        Pick the hours you can be booked on each day. Bookable slots are regenerated when you save.
      </p>

      <div className={styles.days}>
        {draft.map((hour) => (
          <div key={hour.dayOfWeek} className={`${styles.row} ${hour.isEnabled ? styles.rowOpen : ''}`}>
            <label className={styles.dayToggle}>
              <input
                type="checkbox"
                checked={hour.isEnabled}
                onChange={() => updateDay(hour.dayOfWeek, { isEnabled: !hour.isEnabled })}
                className={styles.checkbox}
              />
              <span className={styles.dayName}>{DAY_NAMES[hour.dayOfWeek]}</span>
            </label>

            {hour.isEnabled ? (
              <div className={styles.times}>
                <Select
                  options={TIME_OPTIONS}
                  value={hour.startTime}
                  onChange={(value) => updateDay(hour.dayOfWeek, { startTime: value })}
                  ariaLabel={`${DAY_NAMES[hour.dayOfWeek]} start time`}
                  className={styles.timeSelect}
                />
                <span className={styles.dash} aria-hidden="true">
                  –
                </span>
                <Select
                  options={END_TIME_OPTIONS}
                  value={hour.endTime}
                  onChange={(value) => updateDay(hour.dayOfWeek, { endTime: value })}
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
        <button type="button" className={styles.cancel} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.save}
          onClick={() => onSave(draft)}
          disabled={saving || invalidDays.length > 0 || !hasEnabledDays}
        >
          {saving ? 'Saving…' : 'Save and update slots'}
        </button>
      </div>
    </div>
  );
}

export default WorkingHoursModal;
