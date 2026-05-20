import { useState, useCallback } from 'react';
import { adminFeedbackApi, type AdminFeedback } from '@/lib/api/adminFeedback';

export function useUserFeedbackHistory() {
  const [cache, setCache] = useState<Record<string, AdminFeedback[]>>({});
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchForUser = useCallback(
    async (userId: string) => {
      if (cache[userId]) return; // already loaded
      try {
        setLoadingUserId(userId);
        setError(null);
        const response = await adminFeedbackApi.getForUser(userId);
        if (response.success && response.data) {
          setCache((prev) => ({ ...prev, [userId]: response.data as AdminFeedback[] }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoadingUserId(null);
      }
    },
    [cache],
  );

  return { cache, loadingUserId, error, fetchForUser };
}
