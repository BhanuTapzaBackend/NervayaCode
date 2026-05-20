import { useState, useEffect } from 'react';
import { therapistsApi } from '@/lib/api/therapists';
import { Therapist } from '@/types/therapist.types';

export function useTherapists(params?: Record<string, string | number | boolean | undefined>) {
  const [data, setData] = useState<Therapist[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const paramsKey = JSON.stringify(params ?? {});

  useEffect(() => {
    let active = true;

    async function fetchTherapists() {
      setIsLoading(true);
      try {
        const result = await therapistsApi.getAll(params);
        if (active) {
          setData(result.data || []);
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

    void fetchTherapists();

    return () => {
      active = false;
    };
    // paramsKey is a stable serialization of params; listing params would cause unnecessary reruns when object reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- params encoded in paramsKey
  }, [paramsKey]);

  return { data, isLoading, error };
}
