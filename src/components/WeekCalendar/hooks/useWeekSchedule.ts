import { useState, useEffect, useCallback } from 'react';
import { scheduleApi, type TimeSlot } from '@/lib/api/schedule';
import { toDateStr } from '../utils/calendarHelpers';

export interface WeekScheduleData {
  scheduleMap: Map<string, TimeSlot[]>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWeekSchedule(therapistId: string, weekStart: Date): WeekScheduleData {
  const [scheduleMap, setScheduleMap] = useState<Map<string, TimeSlot[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startStr = toDateStr(weekStart);
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 6);
  const endStr = toDateStr(endDate);

  const fetchSchedule = useCallback(async () => {
    if (!therapistId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await scheduleApi.getByDateRange(therapistId, startStr, endStr, true);
      if (result.success && result.data) {
        const map = new Map<string, TimeSlot[]>();
        for (const schedule of result.data) {
          map.set(schedule.date, schedule.slots);
        }
        setScheduleMap(map);
      } else {
        setError('Failed to fetch schedule');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  }, [therapistId, startStr, endStr]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return { scheduleMap, loading, error, refetch: fetchSchedule };
}
