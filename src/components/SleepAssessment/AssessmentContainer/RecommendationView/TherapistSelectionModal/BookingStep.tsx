'use client';

import { type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { ICON_LOADING } from '@/constants/icons';
import DatePicker from '@/components/Booking/DatePicker';
import TimeSlotGrid from '@/components/Booking/TimeSlotGrid';
import type { TherapistSlot } from '@/types/session.types';
import styles from './styles.module.css';

interface BookingStepProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate: Date;
  maxDate: Date;
  fullyBookedDates: Set<string>;
  onMonthChange: (monthStart: Date) => void;
  slotAvailability: Map<string, number>;
  slotsLoading: boolean;
  slotsError: string | null;
  slotsForGrid: TherapistSlot[];
  selectedSlot: string | null;
  onSlotSelect: (id: string) => void;
}

export function BookingStep({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  fullyBookedDates,
  onMonthChange,
  slotAvailability,
  slotsLoading,
  slotsError,
  slotsForGrid,
  selectedSlot,
  onSlotSelect,
}: Readonly<BookingStepProps>) {
  let slotsContent: ReactNode;
  if (slotsLoading) {
    slotsContent = (
      <div className={styles.loading}>
        <Icon icon={ICON_LOADING} aria-hidden /> Loading slots...
      </div>
    );
  } else if (slotsError) {
    slotsContent = <p className={styles.error}>{slotsError}</p>;
  } else {
    slotsContent = <TimeSlotGrid slots={slotsForGrid} selectedSlot={selectedSlot} onSlotSelect={onSlotSelect} />;
  }

  return (
    <div className={styles.bookingGrid}>
      <section className={styles.dateSection}>
        <h3 className={styles.sectionTitle}>Select Date</h3>
        <DatePicker
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          minDate={minDate}
          maxDate={maxDate}
          fullyBookedDates={fullyBookedDates}
          onMonthChange={onMonthChange}
          slotAvailability={slotAvailability}
        />
      </section>
      <section className={styles.slotsSection}>
        <h3 className={styles.sectionTitle}>Available Time Slots</h3>
        {slotsContent}
      </section>
    </div>
  );
}
