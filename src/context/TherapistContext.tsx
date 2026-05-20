'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { therapistApi, type TherapistSession } from '@/lib/api/therapistApi';
import type { Therapist } from '@/types/therapist.types';
import { useAuth } from '@/hooks/useAuth';

interface TherapistContextType {
  profile: Therapist | null;
  sessions: TherapistSession[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const TherapistContext = createContext<TherapistContextType | undefined>(undefined);

export function TherapistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Therapist | null>(null);
  const [sessions, setSessions] = useState<TherapistSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [meRes, sessionsRes] = await Promise.all([therapistApi.getMe(), therapistApi.getSessions()]);

      if (meRes?.success && meRes?.data) {
        setProfile(meRes.data);
      } else {
        setError(meRes?.message || 'Could not load therapist profile. Contact admin to link your account.');
      }

      if (sessionsRes?.success && Array.isArray(sessionsRes?.data)) {
        setSessions(sessionsRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load therapist data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  return (
    <TherapistContext.Provider
      value={{
        profile,
        sessions,
        loading,
        error,
        refreshData,
      }}
    >
      {children}
    </TherapistContext.Provider>
  );
}

export function useTherapist() {
  const context = useContext(TherapistContext);
  if (context === undefined) {
    throw new Error('useTherapist must be used within a TherapistProvider');
  }
  return context;
}
