'use client';

import React, { useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { MiniCalendar } from '../MiniCalendar';
import { WorkingHoursModal } from '../WorkingHoursModal';
import { useConsultingHours } from '@/components/Admin/ConsultingHoursManager/useConsultingHours';
import { therapistsApi } from '@/lib/api/therapists';
import type { ConsultingHour } from '@/types/therapist.types';
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
  const [isHoursModalOpen, setHoursModalOpen] = useState(false);

  const {
    consultingHours,
    loading,
    saving,
    generating,
    error,
    generationStatus,
    handleUpdate,
    generateSlots,
    fetchConsultingHours,
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

  // No debounced auto-save.
  //
  // The modal is now the only editor of these hours and it saves explicitly, so
  // a background timer had nothing left to catch — but it did actively cause
  // harm: it fired on whatever landed in shared state, which meant Cancel
  // persisted the abandoned edits a second after closing, and an explicit Save
  // was chased by a redundant second save that regenerated 30 days of slots
  // all over again.
  const handleSaveAndGenerate = useCallback(
    async (hours: ConsultingHour[]): Promise<boolean> => {
      // Generate only if the save actually landed, otherwise we would rebuild 30
      // days of slots from the hours still on the server.
      if (!(await handleUpdate(hours))) return false;
      await generateSlots(30);
      return true;
    },
    [handleUpdate, generateSlots],
  );

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

      {/* Working Hours — summary + editor in a modal.
          The inline version had to fit a checkbox, a day name and two time
          fields into a ~240px column, so the times clipped mid-value. */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Icon icon="solar:clock-circle-bold" width={14} height={14} />
          Working Hours
        </h3>

        <ul className={styles.hoursSummary}>
          {consultingHours.map((hour) => (
            <li key={hour.dayOfWeek} className={styles.summaryRow}>
              <span className={hour.isEnabled ? styles.summaryDayOpen : styles.summaryDay}>
                {DAY_LABELS[hour.dayOfWeek]}
              </span>
              <span className={hour.isEnabled ? styles.summaryTime : styles.closedLabel}>
                {hour.isEnabled ? `${hour.startTime} – ${hour.endTime}` : 'Closed'}
              </span>
            </li>
          ))}
        </ul>

        {/* Disabled until the hours have loaded. The editor seeds its draft once,
            when it mounts, so opening it against an empty list would leave it
            blank with nothing to re-seed it. */}
        <button
          type="button"
          className={styles.editHoursBtn}
          onClick={() => setHoursModalOpen(true)}
          disabled={loading || consultingHours.length === 0}
        >
          <Icon icon="solar:clock-circle-bold" width={14} height={14} aria-hidden="true" />
          {loading ? 'Loading hours…' : 'Edit working hours'}
        </button>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {/* A failed load leaves no hours, which keeps the editor disabled. Give
            it a way back — otherwise the button stays dead for the whole session
            with nothing the therapist can do about it. Deliberately NOT falling
            back to the default "all closed" set: that would invite saving it
            over real hours we simply could not read. */}
        {!loading && consultingHours.length === 0 && (
          <button type="button" className={styles.editHoursBtn} onClick={() => fetchConsultingHours()}>
            <Icon icon="solar:refresh-bold" width={14} height={14} aria-hidden="true" />
            Retry loading hours
          </button>
        )}
        {generationStatus && <p className={generating ? styles.infoMsg : styles.successMsg}>{generationStatus}</p>}
        {saving && <p className={styles.infoMsg}>Saving timings...</p>}
      </div>

      <WorkingHoursModal
        isOpen={isHoursModalOpen}
        onClose={() => setHoursModalOpen(false)}
        consultingHours={consultingHours}
        onSave={async (hours) => {
          // Stay open on failure so the draft survives and the error is visible
          // — the modal renders `error`, and closing made that unreachable.
          if (await handleSaveAndGenerate(hours)) setHoursModalOpen(false);
        }}
        saving={saving || generating}
        error={error}
      />
    </aside>
  );
};
