'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Therapist } from '@/types/therapist.types';
import { loadPlanTherapySelection } from './planTherapySelection';

/**
 * Selection state for the plan's therapist popup.
 *
 * There are no steps any more. The popup used to walk recommended-therapist →
 * booking → (optionally) other-therapists, which is why this once carried
 * `showList`, `action` and `backToProfile`. Everything is on one screen now, so
 * the state is just "which therapist, which date, which slot".
 */
export function useTherapistSelection() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // Seeded from the previous visit's pick, so reopening the popup resumes where
  // the user left off. Only ids/strings are restored — the Therapist object is
  // matched from the live directory once it loads, so a therapist who has since
  // been removed simply does not come back.
  const [restored] = useState(() => loadPlanTherapySelection());

  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(restored?.therapistId ?? null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (!restored?.date) return today;
    const parsed = new Date(`${restored.date}T00:00:00`);
    // A stored date in the past would open the calendar on a month with nothing
    // bookable in it.
    return Number.isNaN(parsed.getTime()) || parsed < today ? today : parsed;
  });
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(restored?.slot ?? null);

  const pickTherapist = useCallback((t: Therapist) => {
    setSelectedTherapistId(t._id);
    // Slots belong to a therapist; keeping the old one would show a time this
    // therapist may not offer and submit an unbookable slot.
    setSelectedSlot(null);
  }, []);

  const pickDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedSlot(null);
  }, []);

  /** Drops a restored slot that turned out to be unavailable, keeping the therapist. */
  const clearSlot = useCallback(() => setSelectedSlot(null), []);

  return {
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
    clearSlot,
  };
}
