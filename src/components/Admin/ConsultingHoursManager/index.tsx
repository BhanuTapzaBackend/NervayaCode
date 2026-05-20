'use client';

import { DAYS_OF_WEEK } from '@/lib/constants/consultingHours.constants';
import { useConsultingHours } from './useConsultingHours';
import { ConfirmDialog } from './ConfirmDialog';
import { DayRow } from './DayRow';
import { WeekSummary } from './WeekSummary';
import styles from './styles.module.css';

interface ConsultingHoursManagerProps {
  therapistId: string;
  onUpdate?: () => void;
}

export default function ConsultingHoursManager({ therapistId, onUpdate }: ConsultingHoursManagerProps) {
  const {
    consultingHours,
    saving,
    generating,
    error,
    success,
    generationStatus,
    showConfirmDialog,
    setShowConfirmDialog,
    hasEnabledDays,
    hasUnsavedChanges,
    isSaved,
    handleUpdate,
    generateSlots,
    updateDayHours,
    toggleDay,
    applyToWeekdays,
    applyToAllDays,
    handleConfirmClear,
  } = useConsultingHours({ therapistId, onUpdate });

  const statusBannerClass =
    generationStatus?.includes('Warning') || generationStatus?.includes('Failed')
      ? styles.errorBanner
      : styles.successBanner;
  const statusIcon =
    generationStatus?.includes('Warning') || generationStatus?.includes('Failed') ? 'Warning' : 'Success';

  return (
    <div className={styles.container}>
      <div className={styles.workflowSteps}>
        <div className={`${styles.step} ${hasEnabledDays ? styles.stepCompleted : styles.stepActive}`}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>Set Consulting Hours</div>
            <div className={styles.stepDescription}>Enable days and set time ranges</div>
          </div>
        </div>
        <div className={styles.stepConnector} />
        <div
          className={`${styles.step} ${
            isSaved ? styles.stepCompleted : hasEnabledDays ? styles.stepActive : styles.stepPending
          }`}
        >
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>Save Hours</div>
            <div className={styles.stepDescription}>Save your settings to database</div>
          </div>
        </div>
        <div className={styles.stepConnector} />
        <div className={`${styles.step} ${isSaved ? styles.stepActive : styles.stepPending}`}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>Generate Slots</div>
            <div className={styles.stepDescription}>Create time slots for bookings</div>
          </div>
        </div>
      </div>

      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Professional Consulting Hours</h3>
          <p className={styles.subtitle}>
            Configure when this therapist is available. After saving, generate time slots for patient bookings.
          </p>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <span>Warning</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className={styles.successBanner}>
          <span>Success</span>
          <span>{success}</span>
        </div>
      )}
      {generationStatus && (
        <div className={statusBannerClass}>
          <span>{statusIcon}</span>
          <span>{generationStatus}</span>
        </div>
      )}

      {showConfirmDialog && (
        <ConfirmDialog
          message="Are you sure you want to clear all consulting hours?"
          confirmLabel="Clear All"
          cancelLabel="Cancel"
          onConfirm={handleConfirmClear}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h4 className={styles.sectionTitle}>Step 1: Set Your Consulting Hours</h4>
          {hasEnabledDays && (
            <div className={styles.quickActions}>
              <button
                type="button"
                onClick={applyToWeekdays}
                className={styles.quickActionButton}
                title="Apply Monday's hours to all weekdays"
              >
                Apply to Weekdays
              </button>
              <button
                type="button"
                onClick={applyToAllDays}
                className={styles.quickActionButton}
                title="Apply first enabled day's hours to all days"
              >
                Apply to All Days
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDialog(true)}
                className={styles.quickActionButton}
                title="Clear all consulting hours"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
        <WeekSummary consultingHours={consultingHours} />
        <div className={styles.hoursList}>
          {DAYS_OF_WEEK.map((day) => {
            const dayHours = consultingHours.find((h) => h.dayOfWeek === day.value);
            if (!dayHours) return null;
            return (
              <DayRow
                key={day.value}
                dayLabel={day.label}
                dayHours={dayHours}
                onToggle={() => toggleDay(day.value)}
                onUpdate={(updates) => updateDayHours(day.value, updates)}
              />
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h4 className={styles.sectionTitle}>
            Step 2: Save Consulting Hours
            {hasUnsavedChanges && <span className={styles.unsavedBadge}>Unsaved Changes</span>}
            {isSaved && <span className={styles.savedBadge}>Saved</span>}
          </h4>
        </div>
        <div className={styles.saveSection}>
          <p className={styles.saveDescription}>
            {hasUnsavedChanges
              ? 'You have unsaved changes. Click the button below to save your consulting hours to the database.'
              : isSaved
                ? 'Your consulting hours are saved. You can now generate time slots for patient bookings.'
                : 'Set at least one day with consulting hours, then save to continue.'}
          </p>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={saving || generating || !hasEnabledDays}
            className={styles.saveButton}
          >
            {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Save Consulting Hours'}
          </button>
        </div>
      </div>

      {isSaved && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>Step 3: Generate Time Slots</h4>
          </div>
          <div className={styles.generateSection}>
            <p className={styles.generateDescription}>
              Generate time slots based on your saved consulting hours. Slots will be created in 30-minute intervals.
            </p>
            <div className={styles.generateButtons}>
              <button
                type="button"
                onClick={() => generateSlots(7)}
                disabled={saving || generating}
                className={styles.generateButton}
              >
                {generating ? 'Generating...' : 'Generate for 1 Week'}
              </button>
              <button
                type="button"
                onClick={() => generateSlots(30)}
                disabled={saving || generating}
                className={styles.generateButton}
              >
                {generating ? 'Generating...' : 'Generate for 1 Month'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
