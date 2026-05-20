import { useState, useEffect, useRef } from 'react';
import {
  adminReviewsApi,
  type AdminReview,
  type PaginationMeta,
  type AdminReviewFiltersParams,
} from '@/lib/api/adminReviews';

export function useAdminReviews(page: number, limit: number, filters?: AdminReviewFiltersParams) {
  const [data, setData] = useState<AdminReview[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const serializedFilters = JSON.stringify(filters ?? {});

  useEffect(() => {
    let cancelled = false;

    async function fetchReviews() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await adminReviewsApi.getAll(page, limit, filtersRef.current);
        if (cancelled) return;
        if (response.success && response.data) {
          setData(response.data.data);
          setMeta(response.data.meta);
        } else {
          setData([]);
          setMeta(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load reviews');
        setData([]);
        setMeta(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchReviews();
    return () => {
      cancelled = true;
    };
  }, [page, limit, serializedFilters, fetchTrigger]);

  const refetch = () => setFetchTrigger((prev) => prev + 1);

  return { data, meta, isLoading, error, refetch };
}
