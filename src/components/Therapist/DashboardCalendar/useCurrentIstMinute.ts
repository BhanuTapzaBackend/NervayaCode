'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { istMinutesOfDay, toIsoDayKey } from '@/utils/therapistDate';

/**
 * The IST day key for "now", settled after mount.
 *
 * Returns null on the first render so the server and client agree. Reading the
 * clock during render would mismatch on hydration whenever the two straddle IST
 * midnight, marking the wrong column as today.
 */
export function useTodayIstKey(): string | null {
  const subscribe = useCallback((onChange: () => void) => {
    // Re-settle at the next IST midnight so a tab left open overnight moves the
    // highlight instead of pinning yesterday.
    let timeout: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const now = new Date();
      const msToMidnight = new Date(`${toIsoDayKey(now)}T00:00:00+05:30`).getTime() + 86_400_000 - now.getTime();
      timeout = setTimeout(
        () => {
          onChange();
          schedule();
        },
        Math.max(1000, msToMidnight),
      );
    };

    schedule();
    return () => clearTimeout(timeout);
  }, []);

  // The snapshot is a string, so React's Object.is check is stable within a day.
  // `null` on the server keeps SSR and hydration in agreement.
  return useSyncExternalStore(
    subscribe,
    () => toIsoDayKey(new Date()),
    () => null,
  );
}

/**
 * Minutes since IST midnight, ticking once a minute — the position of the "now"
 * line in the grid.
 *
 * Returns null on the first render so the server and client agree. Reading the
 * clock during render would hydrate a different value than the server produced
 * and warn about a mismatch, and the line would be stale within the minute
 * anyway.
 */
export function useCurrentIstMinute(): number | null {
  const [minute, setMinute] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setMinute(istMinutesOfDay(new Date().toISOString()));
    tick();

    // Align to the next minute boundary, then tick every 60s, so the line moves
    // when the clock does rather than 40s late.
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      tick();
      interval = setInterval(tick, 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  return minute;
}
