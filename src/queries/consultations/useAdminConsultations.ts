import { useState, useEffect, useCallback } from 'react';
import { consultationsApi } from '@/lib/api/consultations';
import type { PaginationMeta } from '@/types/pagination.types';
import type { ConsultationFiltersParams, ConsultationLead } from '@/types/consultation.types';

export function useAdminConsultations(page: number, limit: number, filters?: ConsultationFiltersParams) {
  const [data, setData] = useState<ConsultationLead[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const filtersKey = JSON.stringify(filters ?? {});

  useEffect(() => {
    let active = true;

    async function fetchConsultations() {
      setIsLoading(true);
      setError(null);
      try {
        const parsed: ConsultationFiltersParams = JSON.parse(filtersKey);
        const response = await consultationsApi.getAllForAdmin(page, limit, parsed);
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
        setError(err instanceof Error ? err.message : 'Failed to load consultations');
        setData([]);
        setMeta(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchConsultations();
    return () => {
      active = false;
    };
  }, [page, limit, filtersKey, fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  return { data, meta, isLoading, error, refetch };
}
