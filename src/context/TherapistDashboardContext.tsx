'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { therapistApi, type TherapistDashboardData } from '@/lib/api/therapistApi';
import { getIstWeekStart, addDays, startOfIstDay, toIsoDayKey } from '@/utils/therapistDate';
import { useIsNarrowViewport } from '@/hooks/useIsNarrowViewport';

export type CalendarView = 'day' | 'week';

interface TherapistDashboardContextValue {
  data: TherapistDashboardData | undefined;
  isLoading: boolean;
  error: Error | null;
  /** Start of the visible range, as an IST-anchored instant. */
  rangeStart: Date;
  /**
   * Day or week. Lives HERE, not in page state: it was page-local, so moving
   * between /dashboard and /calendar reset it to 'week' while the context was
   * still fetching a one-day range — six permanently empty columns.
   */
  view: CalendarView;
  setView: (view: CalendarView) => void;
  setRangeStart: (start: Date) => void;
  refetch: () => void;
}

const TherapistDashboardContext = createContext<TherapistDashboardContextValue | undefined>(undefined);

/**
 * One dashboard fetch shared by the sidebar summary, the stat cards, the
 * calendar and the rail.
 *
 * Without this each of them would call the same endpoint independently on every
 * render of the shell — four requests for one screen.
 */
export function TherapistDashboardProvider({ children }: { children: ReactNode }) {
  // `null` means "the therapist hasn't chosen", so the viewport decides. Doing
  // this by derivation rather than an effect avoids the cascading render that
  // setting state from an effect causes, and there is no post-hydration snap.
  const isNarrow = useIsNarrowViewport();
  const [chosenView, setChosenView] = useState<CalendarView | null>(null);
  const view: CalendarView = chosenView ?? (isNarrow ? 'day' : 'week');

  // Captured once so the range cannot drift mid-session as the clock ticks.
  const today = useMemo(() => startOfIstDay(new Date()), []);
  const [chosenStart, setChosenStart] = useState<Date | null>(null);
  // A 7-column grid must start on Monday; a single-day view should start TODAY,
  // not the week's Monday, which is usually in the past.
  const rangeStart = chosenStart ?? (view === 'day' ? today : getIstWeekStart(today));
  const [data, setData] = useState<TherapistDashboardData | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const rangeDays = view === 'day' ? 1 : 7;
  const startKey = toIsoDayKey(rangeStart);
  const endKey = toIsoDayKey(addDays(rangeStart, rangeDays - 1));

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      try {
        const result = await therapistApi.getDashboard(
          new Date(`${startKey}T00:00:00+05:30`).toISOString(),
          new Date(`${endKey}T23:59:59+05:30`).toISOString(),
        );
        if (!active) return;
        setData(result.data ?? undefined);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [startKey, endKey, reloadToken]);

  const setRangeStart = useCallback(
    (start: Date) => {
      // Week view snaps to Monday so the 7 columns line up with the header.
      setChosenStart(view === 'day' ? startOfIstDay(start) : getIstWeekStart(start));
    },
    [view],
  );

  const setView = useCallback(
    (next: CalendarView) => {
      setChosenView(next);
      if (next === 'week') {
        setChosenStart(getIstWeekStart(rangeStart));
        return;
      }
      // Switching to Day should land on today when today is in the visible
      // week, rather than on a Monday that has usually already passed.
      const weekStart = getIstWeekStart(rangeStart);
      const withinWeek = today >= weekStart && today < addDays(weekStart, 7);
      setChosenStart(withinWeek ? today : startOfIstDay(rangeStart));
    },
    [rangeStart, today],
  );

  const value = useMemo<TherapistDashboardContextValue>(
    () => ({
      data,
      isLoading,
      error,
      rangeStart,
      view,
      setView,
      setRangeStart,
      refetch: () => setReloadToken((n) => n + 1),
    }),
    [data, isLoading, error, rangeStart, view, setView, setRangeStart],
  );

  return <TherapistDashboardContext.Provider value={value}>{children}</TherapistDashboardContext.Provider>;
}

export function useTherapistDashboard(): TherapistDashboardContextValue {
  const context = useContext(TherapistDashboardContext);
  if (!context) {
    throw new Error('useTherapistDashboard must be used inside TherapistDashboardProvider');
  }
  return context;
}
