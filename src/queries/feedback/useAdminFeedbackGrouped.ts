import { useState, useEffect, useCallback } from 'react';
import {
  adminFeedbackApi,
  type UserFeedbackSummary,
  type PaginationMeta,
  type AdminFeedbackFiltersParams,
} from '@/lib/api/adminFeedback';

export function useAdminFeedbackGrouped(page: number, limit: number, filters?: AdminFeedbackFiltersParams) {
  const [data, setData] = useState<UserFeedbackSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrouped = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminFeedbackApi.getGrouped(page, limit, filters);
      if (response.success && response.data) {
        setData(response.data.data);
        setMeta(response.data.meta);
      } else {
        setData([]);
        setMeta(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
      setData([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchGrouped();
  }, [fetchGrouped]);

  return { data, meta, isLoading, error, refetch: fetchGrouped };
}
