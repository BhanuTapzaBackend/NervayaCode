'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { MiniCalendar } from '../MiniCalendar';
import { convert12To24, convert24To12 } from '@/lib/utils/time.util';
import { useConsultingHours } from '@/components/Admin/ConsultingHoursManager/useConsultingHours';
import { therapistsApi } from '@/lib/api/therapists';
import { toast } from 'sonner';
import styles from './styles.module.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
];

interface CalendarSidebarProps {
  therapistId: string;
  role: 'admin' | 'therapist';
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onSlotsGenerated: () => void;
  sessionDurationMins: number;
  therapistName?: string;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  therapistId,
  role,
  selectedDate,
  onDateSelect,
  onSlotsGenerated,
  sessionDurationMins,
  therapistName,
}) => {
  const [duration, setDuration] = useState(sessionDurationMins);
  const [savingDuration, setSavingDuration] = useState(false);

  const {
    consultingHours,
    saving,
    generating,
    error,
    generationStatus,
    hasEnabledDays,
    hasUnsavedChanges,
    handleUpdate,
    generateSlots,
    updateDayHours,
    toggleDay,
  } = useConsultingHours({ therapistId, onUpdate: onSlotsGenerated });

  const handleDurationChange = async (newDuration: number) => {
    setDuration(newDuration);
    setSavingDuration(true);
    try {
      await therapistsApi.update(therapistId, { sessionDurationMins: newDuration });
      toast.success(`Session duration updated to ${newDuration} min`);
      generateSlots(30); // auto generate slots on duration change
    } catch {
      toast.error('Failed to update session duration');
      setDuration(sessionDurationMins);
    } finally {
      setSavingDuration(false);
    }
  };

  const handleSaveAndGenerate = useCallback(async () => {
    await handleUpdate();
    await generateSlots(30);
  }, [handleUpdate, generateSlots]);

  // Debounced Auto-Save
  useEffect(() => {
    if (!hasUnsavedChanges || !hasEnabledDays) return;
    const timer = setTimeout(() => {
      handleSaveAndGenerate();
    }, 1000);
    return () => clearTimeout(timer);
  }, [consultingHours, hasUnsavedChanges, hasEnabledDays, handleSaveAndGenerate]);

  return (
    <aside className={`${styles.sidebar} ${role === 'admin' ? styles.adminSidebarMode : styles.therapistSidebarMode}`}>
      {/* Therapist Profile Pill (Moved from Header) */}
      {therapistName && (
        <>
          <div className={styles.section}>
            <div className={styles.therapistPill}>
              <Icon icon="solar:user-circle-bold" width={18} height={18} className={styles.therapistIcon} />
              <span className={styles.therapistName}>{therapistName}</span>
            </div>
          </div>
          <div className={styles.divider} />
        </>
      )}

      {/* Session Duration (admin only) */}
      {role === 'admin' && (
        <>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Icon icon="solar:clock-square-bold" width={14} height={14} />
              Session Duration
            </h3>
            <select
              className={styles.durationSelect}
              value={duration}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
              disabled={savingDuration}
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.divider} />
        </>
      )}

      {/* Mini Calendar */}
      <div className={styles.section}>
        <MiniCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} />
      </div>

      <div className={styles.divider} />

      {/* Working Hours */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Icon icon="solar:clock-circle-bold" width={14} height={14} />
          Working Hours
        </h3>

        <div className={styles.daysList}>
          {consultingHours.map((hour) => (
            <div key={hour.dayOfWeek} className={`${styles.dayRow} ${hour.isEnabled ? styles.dayEnabled : ''}`}>
              <label className={styles.dayToggle}>
                <input
                  type="checkbox"
                  checked={hour.isEnabled}
                  onChange={() => toggleDay(hour.dayOfWeek)}
                  className={styles.checkbox}
                />
                <span className={styles.dayLabel}>{DAY_LABELS[hour.dayOfWeek]}</span>
              </label>
              {hour.isEnabled && (
                <div className={styles.timeInputs}>
                  <input
                    type="time"
                    value={convert12To24(hour.startTime)}
                    onChange={(e) => updateDayHours(hour.dayOfWeek, { startTime: convert24To12(e.target.value) })}
                    className={styles.timeInput}
                  />
                  <span className={styles.timeDash}>-</span>
                  <input
                    type="time"
                    value={convert12To24(hour.endTime)}
                    onChange={(e) => updateDayHours(hour.dayOfWeek, { endTime: convert24To12(e.target.value) })}
                    className={styles.timeInput}
                  />
                </div>
              )}
              {!hour.isEnabled && <span className={styles.closedLabel}>Closed</span>}
            </div>
          ))}
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}
        {generationStatus && <p className={generating ? styles.infoMsg : styles.successMsg}>{generationStatus}</p>}
        {saving && <p className={styles.infoMsg}>Saving timings...</p>}
      </div>
    </aside>
  );
};
