import { useState, useEffect, useCallback } from 'react';
import { consultationsApi } from '@/lib/api/consultations';
import type { ConsultationScheduleDay } from '@/types/consultation.types';

export function useConsultationSchedule(from: string, to: string) {
  const [schedules, setSchedules] = useState<ConsultationScheduleDay[]>([]);
  const [generatedThrough, setGeneratedThrough] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function fetchSchedule() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await consultationsApi.getSchedule(from, to);
        if (!active) return;
        if (response.success && response.data) {
          setSchedules(response.data.schedules);
          setGeneratedThrough(response.data.generatedThrough);
        } else {
          setSchedules([]);
          setGeneratedThrough(null);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load schedule');
        setSchedules([]);
        setGeneratedThrough(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchSchedule();
    return () => {
      active = false;
    };
  }, [from, to, fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  return { schedules, generatedThrough, isLoading, error, refetch };
}
