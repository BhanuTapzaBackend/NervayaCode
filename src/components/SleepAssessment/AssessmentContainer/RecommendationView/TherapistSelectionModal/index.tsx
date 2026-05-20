'use client';

import { useMemo, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { ICON_CLOSE, ICON_LOADING, ICON_ARROW_LEFT } from '@/constants/icons';
import { useBookingSlots } from '@/components/Booking/BookingModal/useBookingSlots';
import { useTherapists } from '@/queries/therapists/useTherapists';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import type { Therapist } from '@/types/therapist.types';
import type { TherapistSlot } from '@/types/session.types';
import type { AssessmentResult } from '@/utils/sleepAssessment';
import { useTherapistSelection, type TherapyAction } from './useTherapistSelection';
import { pickRecommendedTherapist } from './recommendTherapist';

export type { TherapyAction } from './useTherapistSelection';
import { RecommendedTherapistCard } from './RecommendedTherapistCard';
import { TherapistList } from './TherapistList';
import { BookingStep } from './BookingStep';
import styles from './styles.module.css';

export interface TherapistSelection {
  therapistId: string;
  therapistName: string;
  therapistImage?: string;
  sessionFee: number;
  date: string;
  slot: string;
}

interface TherapistSelectionModalProps {
  fallbackPrice: number;
  result: AssessmentResult;
  onConfirm: (selection: TherapistSelection, action: TherapyAction) => void;
  onClose: () => void;
}

export function TherapistSelectionModal({
  fallbackPrice,
  result,
  onConfirm,
  onClose,
}: Readonly<TherapistSelectionModalProps>) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const { data: therapists, isLoading: therapistsLoading } = useTherapists({ isAvailable: true });
  const {
    today,
    maxDate,
    selectedTherapist,
    showList,
    action,
    selectedDate,
    visibleMonth,
    selectedSlot,
    setSelectedSlot,
    setVisibleMonth,
    pickTherapist,
    showOtherTherapists,
    hideOtherTherapists,
    startBooking,
    backToProfile,
    pickDate,
  } = useTherapistSelection();

  useModalDismiss(true, modalRef, onClose);

  const recommended = useMemo(() => pickRecommendedTherapist(therapists, result), [therapists, result]);
  const activeTherapist: Therapist | null = selectedTherapist ?? recommended;
  const otherTherapists = (therapists ?? []).filter((t) => t._id !== activeTherapist?._id);

  const {
    schedule,
    loading: slotsLoading,
    error: slotsError,
    fullyBookedDates,
    slotAvailability,
  } = useBookingSlots(activeTherapist?._id ?? '', selectedDate, visibleMonth);

  const slotsForGrid = useMemo<TherapistSlot[]>(
    () =>
      (schedule?.slots ?? []).map((slot) => ({
        _id: slot.startTime,
        therapistId: activeTherapist?._id ?? '',
        date: schedule?.date ?? '',
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: slot.isAvailable,
        isCustomized: slot.isCustomized,
        sessionId: slot.sessionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    [schedule, activeTherapist],
  );

  const handleConfirm = () => {
    if (!activeTherapist || !schedule || !selectedSlot || !action) return;
    onConfirm(
      {
        therapistId: activeTherapist._id,
        therapistName: activeTherapist.name,
        therapistImage: activeTherapist.image,
        sessionFee: activeTherapist.sessionFee ?? fallbackPrice,
        date: schedule.date,
        slot: selectedSlot,
      },
      action,
    );
  };

  if (typeof document === 'undefined') return null;

  const hasNoTherapists = !therapistsLoading && !activeTherapist;
  const inBooking = !!action && !showList;

  let bodyContent: ReactNode;
  let headerTitle = 'Your therapist match';
  let onBack: (() => void) | null = null;

  if (therapistsLoading) {
    headerTitle = 'Choose your therapist';
    bodyContent = (
      <div className={styles.loading}>
        <Icon icon={ICON_LOADING} aria-hidden /> Loading therapists...
      </div>
    );
  } else if (hasNoTherapists) {
    headerTitle = 'Choose your therapist';
    bodyContent = (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No therapists available right now.</p>
        <p className={styles.emptyBody}>
          You can still add Deep Rest + Supplement to your plan now and book a therapist later from Therapy Corner.
        </p>
        <button type="button" className={styles.emptyCta} onClick={onClose}>
          Close and continue without therapy
        </button>
      </div>
    );
  } else if (showList) {
    headerTitle = 'Choose your therapist';
    onBack = hideOtherTherapists;
    bodyContent = <TherapistList therapists={therapists ?? []} fallbackPrice={fallbackPrice} onPick={pickTherapist} />;
  } else if (inBooking && activeTherapist) {
    headerTitle = activeTherapist.name;
    onBack = backToProfile;
    bodyContent = (
      <BookingStep
        selectedDate={selectedDate}
        onDateSelect={pickDate}
        minDate={today}
        maxDate={maxDate}
        fullyBookedDates={fullyBookedDates}
        onMonthChange={setVisibleMonth}
        slotAvailability={slotAvailability}
        slotsLoading={slotsLoading}
        slotsError={slotsError}
        slotsForGrid={slotsForGrid}
        selectedSlot={selectedSlot}
        onSlotSelect={setSelectedSlot}
      />
    );
  } else if (activeTherapist) {
    bodyContent = (
      <RecommendedTherapistCard
        therapist={activeTherapist}
        fallbackPrice={fallbackPrice}
        hasOtherTherapists={otherTherapists.length > 0}
        onStartBooking={startBooking}
        onViewOthers={showOtherTherapists}
      />
    );
  }

  let summaryText = 'Pick a date and time slot to continue';
  if (schedule && selectedSlot && activeTherapist) {
    summaryText = `${activeTherapist.name} • ${schedule.date} at ${selectedSlot}`;
  }
  const confirmLabel = action === 'book' ? 'Confirm & Book Now' : 'Confirm & Add to Cart';

  const content = (
    <div className={styles.overlay}>
      <dialog
        ref={modalRef}
        open
        className={styles.modal}
        aria-modal="true"
        aria-label="Choose a therapist for your sleep plan"
      >
        <header className={styles.header}>
          {onBack ? (
            <button type="button" className={styles.back} onClick={onBack}>
              <Icon icon={ICON_ARROW_LEFT} aria-hidden />
              Back
            </button>
          ) : (
            <h2 className={styles.title}>{headerTitle}</h2>
          )}
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <Icon icon={ICON_CLOSE} aria-hidden />
          </button>
        </header>

        <div className={styles.body}>{bodyContent}</div>

        {inBooking && (
          <footer className={styles.footer}>
            <p className={styles.summary}>{summaryText}</p>
            <button
              type="button"
              className={styles.confirm}
              onClick={handleConfirm}
              disabled={!schedule || !selectedSlot}
            >
              {confirmLabel}
            </button>
          </footer>
        )}
      </dialog>
    </div>
  );

  return createPortal(content, document.body);
}
