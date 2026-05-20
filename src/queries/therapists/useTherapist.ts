import { useState, useEffect } from 'react';
import { therapistsApi } from '@/lib/api/therapists';
import { Therapist } from '@/types/therapist.types';

export function useTherapist(id: string) {
  const [data, setData] = useState<Therapist | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    if (!id) {
      if (active) setIsLoading(false);
      return;
    }

    async function fetchTherapist() {
      setIsLoading(true);
      try {
        const result = await therapistsApi.getById(id);
        if (active) {
          setData(result.data || undefined);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void fetchTherapist();

    return () => {
      active = false;
    };
  }, [id]);

  return { data, isLoading, error };
}
