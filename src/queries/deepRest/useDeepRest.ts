'use client';

import { useState, useCallback } from 'react';
import { deepRestApi } from '@/lib/api/deepRest';
import type { IDeepRestResponse } from '@/types/deepRest.types';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useAdminDeepRestResponses() {
  const [state, setState] = useState<FetchState<IDeepRestResponse[]>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await deepRestApi.getAllResponsesAdmin();
      setState({ data: res.data ?? null, isLoading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load responses',
      }));
    }
  }, []);

  return { ...state, refetch };
}

export function useAssignDeepRestVideo() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutateAsync = useCallback(async ({ responseId, videoUrl }: { responseId: string; videoUrl: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await deepRestApi.assignVideo(responseId, videoUrl);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to assign video';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutateAsync, isLoading, error };
}
