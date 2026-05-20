import { useState, useMemo, useCallback } from 'react';
import { getMonday, getWeekDates, formatWeekLabel, formatDayLabel } from '../utils/calendarHelpers';

export function useWeekNavigation(viewMode: 'day' | 'week' = 'week') {
  // We keep the state as the currently selected single date (even if it's the start of the week),
  // which defaults to today.  When selecting dates from MiniCalendar, it jumps straight there.
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const goNext = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + (viewMode === 'day' ? 1 : 7));
      return next;
    });
  }, [viewMode]);

  const goPrev = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - (viewMode === 'day' ? 1 : 7));
      return next;
    });
  }, [viewMode]);

  const goToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // weekStart is primarily used by MiniCalendar and week views to anchor starting days.
  const weekStart = useMemo(() => getMonday(currentDate), [currentDate]);

  const viewDates = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    return getWeekDates(weekStart);
  }, [viewMode, currentDate, weekStart]);

  const headerLabel = useMemo(() => {
    if (viewMode === 'day') return formatDayLabel(currentDate);
    return formatWeekLabel(weekStart);
  }, [viewMode, currentDate, weekStart]);

  return {
    currentDate,
    setCurrentDate,
    weekStart, // Keep exposing weekStart for components that explicitly need the bounded Monday
    viewDates,
    headerLabel,
    goNext,
    goPrev,
    goToday,
  };
}
