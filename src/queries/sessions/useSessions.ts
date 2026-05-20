import { useState, useEffect, useCallback } from 'react';
import { sessionsApi, type PaginationMeta, type SessionFiltersParams } from '@/lib/api/sessions';
import type { Session } from '@/types/session.types';

export function useAdminSessions(page: number, limit: number, filters?: SessionFiltersParams) {
  const [data, setData] = useState<Session[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const filtersKey = JSON.stringify(filters ?? {});

  useEffect(() => {
    let active = true;

    async function fetchSessions() {
      setIsLoading(true);
      setError(null);
      try {
        const parsed: SessionFiltersParams = JSON.parse(filtersKey);
        const response = await sessionsApi.getAllForAdmin(page, limit, parsed);
        if (!active) return;
        if (response.success && response.data) {
          setData(response.data.data);
          setMeta(response.data.meta);
        } else {
          setData([]);
          setMeta(null);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
        setData([]);
        setMeta(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchSessions();
    return () => {
      active = false;
    };
  }, [page, limit, filtersKey, fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  return { data, meta, isLoading, error, refetch };
}
