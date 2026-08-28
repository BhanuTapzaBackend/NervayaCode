'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { ICON_CLOSE, ICON_LOADING, ICON_ALERT } from '@/constants/icons';
import { useBookingSlots } from '@/components/Booking/BookingModal/useBookingSlots';
import { useTherapists } from '@/queries/therapists/useTherapists';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { useIsNarrowViewport } from '@/hooks/useIsNarrowViewport';
import type { Therapist } from '@/types/therapist.types';
import type { TherapistSlot } from '@/types/session.types';
import { useTherapistSelection } from './useTherapistSelection';
import { savePlanTherapySelection } from './planTherapySelection';
import { TherapistList } from './TherapistList';
import { SelectedTherapistBar } from './SelectedTherapistBar';
import { BookingStep } from './BookingStep';
import styles from './styles.module.css';

export type { TherapistSelection } from './types';
import type { TherapistSelection } from './types';

interface TherapistSelectionModalProps {
  fallbackPrice: number;
  onConfirm: (selection: TherapistSelection) => void;
  onClose: () => void;
}

/**
 * Picks the therapist and slot for the sleep-plan bundle.
 *
 * One screen: every available therapist on the left, their calendar and slots
 * on the right. It previously opened on a single algorithmically "recommended"
 * therapist with the full list hidden behind a secondary link, and split the
 * choice across three steps.
 *
 * There is ONE action, and it is not "add to cart" or "buy now". The therapist
 * is being chosen as part of a bundle that is a single server-priced order, so
 * offering a cart route here would either split the plan across two payments or
 * charge the undiscounted price — `createOrder` takes `promoDiscount` as a
 * parameter and cannot derive the bundle discount on its own.
 */
export function TherapistSelectionModal({ fallbackPrice, onConfirm, onClose }: Readonly<TherapistSelectionModalProps>) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const { data: therapists, isLoading: therapistsLoading } = useTherapists({ isAvailable: true });
  const {
    today,
    maxDate,
    restored,
    selectedTherapistId,
    selectedDate,
    visibleMonth,
    selectedSlot,
    setSelectedSlot,
    setVisibleMonth,
    pickTherapist,
    pickDate,
  } = useTherapistSelection();

  useModalDismiss(true, modalRef, onClose);

  // Matches the CSS breakpoint where the picker stops being two columns.
  const isNarrow = useIsNarrowViewport('(max-width: 900px)');
  const [changingTherapist, setChangingTherapist] = useState(false);

  const activeTherapist: Therapist | null = useMemo(
    () => (therapists ?? []).find((t) => t._id === selectedTherapistId) ?? null,
    [therapists, selectedTherapistId],
  );

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

  // A restored pick is a hint, not a booking — nothing is held until an order
  // exists, and with a multi-day TTL the slot is often gone. Rather than clear
  // state in an effect (which flashes the stale slot as selected for a frame),
  // the availability check is derived: an unavailable slot is simply not
  // treated as selected, and the notice below explains why.
  const slotsSettled = !slotsLoading && !slotsError && !!schedule;
  const availableSlotIds = useMemo(
    () => new Set(slotsForGrid.filter((s) => s.isAvailable).map((s) => s._id)),
    [slotsForGrid],
  );
  const chosenSlotUnavailable = slotsSettled && !!selectedSlot && !availableSlotIds.has(selectedSlot);
  const effectiveSlot = chosenSlotUnavailable ? null : selectedSlot;

  // The therapist themselves may have been removed or turned unavailable since.
  const restoredTherapistMissing =
    !therapistsLoading && !!restored?.therapistId && !(therapists ?? []).some((t) => t._id === restored.therapistId);

  const canConfirm = !!activeTherapist && !!schedule && !!effectiveSlot;

  // Memoised so the persist effect below fires on a real change of selection,
  // not on every render.
  const selection = useMemo<TherapistSelection | null>(
    () =>
      activeTherapist && schedule && effectiveSlot
        ? {
            therapistId: activeTherapist._id,
            therapistName: activeTherapist.name,
            therapistImage: activeTherapist.image,
            sessionFee: activeTherapist.sessionFee ?? fallbackPrice,
            date: schedule.date,
            slot: effectiveSlot,
          }
        : null,
    [activeTherapist, schedule, effectiveSlot, fallbackPrice],
  );

  // Persisted as soon as the pick is complete, not only on confirm — the whole
  // point is surviving an interruption, and the interruption can happen while
  // the user is still deciding whether to pay.
  useEffect(() => {
    if (selection) savePlanTherapySelection(selection);
  }, [selection]);

  if (typeof document === 'undefined') return null;

  const hasNoTherapists = !therapistsLoading && (therapists ?? []).length === 0;

  // On a phone the two panes are stacked, so showing both means scrolling the
  // whole therapist list before reaching the calendar and the slots. Once a
  // therapist is chosen the list collapses to a single row; "Change" brings it
  // back. On desktop both panes are always visible side by side.
  const listCollapsed = isNarrow && !!activeTherapist && !changingTherapist;
  const showSchedule = !isNarrow || listCollapsed;

  let slotsPanel: ReactNode;
  if (!activeTherapist) {
    slotsPanel = <p className={styles.slotsPrompt}>Select a therapist to see their available times.</p>;
  } else {
    slotsPanel = (
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
        selectedSlot={effectiveSlot}
        onSlotSelect={setSelectedSlot}
      />
    );
  }

  let bodyContent: ReactNode;
  if (therapistsLoading) {
    bodyContent = (
      <div className={styles.loading}>
        <Icon icon={ICON_LOADING} aria-hidden /> Loading therapists...
      </div>
    );
  } else if (hasNoTherapists) {
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
  } else {
    bodyContent = (
      <div className={styles.pickerGrid}>
        <section className={styles.therapistPane}>
          {listCollapsed && activeTherapist ? (
            <SelectedTherapistBar
              therapist={activeTherapist}
              fallbackPrice={fallbackPrice}
              onChange={() => setChangingTherapist(true)}
            />
          ) : (
            <>
              <h3 className={styles.sectionTitle}>Therapists</h3>
              <TherapistList
                therapists={therapists ?? []}
                fallbackPrice={fallbackPrice}
                selectedId={selectedTherapistId}
                onPick={(t) => {
                  pickTherapist(t);
                  setChangingTherapist(false);
                }}
              />
            </>
          )}
        </section>
        {showSchedule && <section className={styles.schedulePane}>{slotsPanel}</section>}
      </div>
    );
  }

  const summaryText = selection
    ? `${selection.therapistName} • ${selection.date} at ${selection.slot}`
    : 'Pick a therapist, date and time to continue';

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
          <h2 className={styles.title}>Choose your therapist</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <Icon icon={ICON_CLOSE} aria-hidden />
          </button>
        </header>

        {(chosenSlotUnavailable || restoredTherapistMissing) && (
          <p className={styles.staleNotice} role="status">
            <Icon icon={ICON_ALERT} aria-hidden />
            {restoredTherapistMissing
              ? 'The therapist you picked earlier is no longer available. Please choose another.'
              : 'The time you picked earlier has been taken. Please choose another slot.'}
          </p>
        )}

        <div className={styles.body}>{bodyContent}</div>

        {!therapistsLoading && !hasNoTherapists && (
          <footer className={styles.footer}>
            <p className={styles.summary}>{summaryText}</p>
            <button
              type="button"
              className={styles.confirm}
              onClick={() => selection && onConfirm(selection)}
              disabled={!canConfirm}
            >
              Confirm &amp; Start My Sleep Plan
            </button>
          </footer>
        )}
      </dialog>
    </div>
  );

  return createPortal(content, document.body);
}
