'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { dashboardApi } from '@/lib/api/dashboard';
import { deepRestApi } from '@/lib/api/deepRest';
import type { Session } from '@/types/session.types';
import type { Order } from '@/types/supplement.types';
import type { ISleepAssessmentResponse } from '@/types/sleepAssessment.types';
import type { IDriftOffResponse } from '@/types/driftOff.types';
import { useAuth } from '@/hooks/useAuth';

interface CustomerContextType {
  sessions: Session[];
  orders: Order[];
  latestAssessment: ISleepAssessmentResponse | null;
  inProgressAssessment: ISleepAssessmentResponse | null;
  driftOffResponses: IDriftOffResponse[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [latestAssessment, setLatestAssessment] = useState<ISleepAssessmentResponse | null>(null);
  const [inProgressAssessment, setInProgressAssessment] = useState<ISleepAssessmentResponse | null>(null);
  const [driftOffResponses, setDriftOffResponses] = useState<IDriftOffResponse[]>([]);

  const refreshData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [sessionsRes, ordersRes, latestRes, inProgressRes, driftOffRes] = await Promise.all([
        dashboardApi.getSessions(),
        dashboardApi.getOrders(),
        dashboardApi.getLatestAssessment(),
        dashboardApi.getInProgressAssessment(),
        deepRestApi
          .getResponses(1, 50)
          .catch(() => ({ success: true, data: { data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 1 } } })),
      ]);

      setSessions(sessionsRes?.data || []);
      setOrders(ordersRes?.data || []);
      setLatestAssessment(latestRes?.data ?? null);
      setInProgressAssessment(inProgressRes?.data ?? null);
      setDriftOffResponses(driftOffRes?.data?.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customer data');
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
    <CustomerContext.Provider
      value={{
        sessions,
        orders,
        latestAssessment,
        inProgressAssessment,
        driftOffResponses,
        loading,
        error,
        refreshData,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
