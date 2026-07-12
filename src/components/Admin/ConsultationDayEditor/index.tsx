'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/common';
import { consultationsApi } from '@/lib/api/consultations';
import { displayToMinutes, minutesToDisplay, hhmmToMinutes } from '@/lib/utils/consultation-time.util';
import type { ConsultationScheduleDay, IConsultationSlot, SlotTime } from '@/types/consultation.types';
import styles from './styles.module.css';

export interface ConsultationDayEditorProps {
  day: ConsultationScheduleDay;
  onSaved: () => void;
  onClose: () => void;
}

const NEW_SLOT_MINUTES = 30;

export default function ConsultationDayEditor({ day, onSaved, onClose }: ConsultationDayEditorProps) {
  const [slots, setSlots] = useState<IConsultationSlot[]>(day.slots);
  const [newStart, setNewStart] = useState('09:00');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed when the admin clicks a different date.
  useEffect(() => {
    setSlots(day.slots);
    setError(null);
  }, [day]);

  const removeSlot = useCallback((startTime: string) => {
    setSlots((prev) => prev.filter((slot) => slot.startTime !== startTime));
  }, []);

  const addSlot = useCallback(() => {
    setError(null);

    let startMinutes: number;
    try {
      startMinutes = hhmmToMinutes(newStart);
    } catch {
      setError('Enter a valid time.');
      return;
    }

    const startTime = minutesToDisplay(startMinutes);
    const endTime = minutesToDisplay(startMinutes + NEW_SLOT_MINUTES);

    // The server rejects overlaps too; catching it here keeps the admin out of a
    // pointless round-trip.
    const overlaps = slots.some((slot) => {
      const existingStart = displayToMinutes(slot.startTime);
      const existingEnd = displayToMinutes(slot.endTime);
      return startMinutes < existingEnd && existingStart < startMinutes + NEW_SLOT_MINUTES;
    });
    if (overlaps) {
      setError(`A slot already overlaps ${startTime}.`);
      return;
    }

    setSlots((prev) =>
      [...prev, { startTime, endTime, isAvailable: true, leadId: null }].sort(
        (a, b) => displayToMinutes(a.startTime) - displayToMinutes(b.startTime),
      ),
    );
  }, [newStart, slots]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const payload: SlotTime[] = slots.map((slot) => ({ startTime: slot.startTime, endTime: slot.endTime }));
      const response = await consultationsApi.replaceDay(day.date, payload);
      if (response.success) {
        onSaved();
      } else {
        setError(response.message ?? 'Could not save this day.');
      }
    } catch {
      setError('Could not save this day. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [day.date, slots, onSaved]);

  return (
    <section className={styles.editor}>
      <header className={styles.header}>
        <h3 className={styles.title}>Editing {day.date}</h3>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close day editor">
          ×
        </button>
      </header>

      {slots.length === 0 ? (
        <p className={styles.empty}>This day has no slots. Nobody can book it.</p>
      ) : (
        <ul className={styles.slotList}>
          {slots.map((slot) => {
            const isBooked = slot.leadId !== null;
            return (
              <li key={slot.startTime} className={isBooked ? styles.slotBooked : styles.slot}>
                <span>
                  {slot.startTime} – {slot.endTime}
                </span>
                {isBooked ? (
                  <span className={styles.lockedLabel}>Booked — cancel it on the Consultations page to free it</span>
                ) : (
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={`Remove ${slot.startTime} slot`}
                    onClick={() => removeSlot(slot.startTime)}
                  >
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.addRow}>
        <label className={styles.addLabel}>
          <span>Add a slot at</span>
          <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
        </label>
        <Button variant="secondary" onClick={addSlot}>
          Add
        </Button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <Button variant="primary" onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save day'}
      </Button>
    </section>
  );
}
