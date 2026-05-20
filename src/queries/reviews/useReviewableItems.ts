import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { reviewsApi, type ReviewableItem } from '@/lib/api/reviews';

export function useReviewableItems(enabled = true) {
  const pathname = usePathname();
  const [data, setData] = useState<ReviewableItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await reviewsApi.getReviewableItems();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviewable items');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    async function run() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await reviewsApi.getReviewableItems();
        if (!active) return;
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setData([]);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load reviewable items');
        setData([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void run();
    return () => {
      active = false;
    };
  }, [enabled, pathname]);

  useEffect(() => {
    const handler = () => {
      void fetchItems();
    };
    window.addEventListener('reviewable-items-updated', handler);
    window.addEventListener('auth-state-changed', handler);
    return () => {
      window.removeEventListener('reviewable-items-updated', handler);
      window.removeEventListener('auth-state-changed', handler);
    };
  }, [fetchItems]);

  return { data, isLoading, error, refetch: fetchItems };
}
