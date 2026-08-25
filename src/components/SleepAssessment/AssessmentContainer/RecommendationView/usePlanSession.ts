'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { SESSION_STATUS } from '@/lib/constants/enums';
import type { Session } from '@/types/session.types';

/**
 * The customer's next upcoming therapy session, if any.
 *
 * The recommendation used to render "Choose a Therapist" unconditionally — it
 * never asked whether a session existed — so it kept prompting after a booking
 * was made and paid for. This is the query that was missing.
 *
 * Not filtered to plan-bought sessions: a customer who booked from Therapy
 * Corner still has that session, and showing it is more honest than asking them
 * to book a second one.
 */
export function usePlanSession(): { session: Session | null; loading: boolean; refresh: () => void } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = (await api.get('/sessions')) as { success?: boolean; data?: Session[] };
        if (!active) return;

        const upcoming = (res?.data ?? [])
          .filter((s) => s.status !== SESSION_STATUS.CANCELLED && s.status !== SESSION_STATUS.COMPLETED)
          // `date` is YYYY-MM-DD, so a plain string sort is chronological.
          .sort((a, b) => a.date.localeCompare(b.date));

        setSession(upcoming[0] ?? null);
      } catch {
        // Signed-out visitors get a 401 here; the CTA is the right fallback.
        if (active) setSession(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [tick]);

  return { session, loading, refresh: () => setTick((n) => n + 1) };
}
