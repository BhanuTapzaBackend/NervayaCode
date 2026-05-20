'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Therapist } from '@/types/therapist.types';

export type TherapyAction = 'cart' | 'book';

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

  // `selectedTherapist` is an override: null means "use the recommended one".
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [showList, setShowList] = useState(false);
  const [action, setAction] = useState<TherapyAction | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const pickTherapist = useCallback((t: Therapist) => {
    setSelectedTherapist(t);
    setShowList(false);
    setSelectedSlot(null);
  }, []);

  const showOtherTherapists = useCallback(() => setShowList(true), []);
  const hideOtherTherapists = useCallback(() => setShowList(false), []);

  const startBooking = useCallback((a: TherapyAction) => {
    setAction(a);
    setSelectedSlot(null);
  }, []);

  const backToProfile = useCallback(() => {
    setAction(null);
    setSelectedSlot(null);
  }, []);

  const pickDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedSlot(null);
  }, []);

  const reset = useCallback(() => {
    setSelectedTherapist(null);
    setShowList(false);
    setAction(null);
    setSelectedSlot(null);
  }, []);

  return {
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
    reset,
  };
}
