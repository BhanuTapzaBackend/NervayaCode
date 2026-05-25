'use client';

import { useSyncExternalStore } from 'react';

export type TimeOfDay = 'morning' | 'night';

const MORNING_START_HOUR = 6;
const MORNING_END_HOUR = 18;

function resolveTimeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours();
  return hour >= MORNING_START_HOUR && hour < MORNING_END_HOUR ? 'morning' : 'night';
}

// No external source to subscribe to — time-of-day is read once per mount.
function subscribe(): () => void {
  return () => {};
}

/**
 * Returns the current time-of-day theme based on the visitor's local clock.
 * Morning is [06:00, 18:00); everything else is night.
 *
 * Uses useSyncExternalStore so the server renders the stable 'morning' snapshot
 * (no hydration mismatch) while the client immediately resolves the real local
 * time. The auth screen flips to the dark theme via CSS variables, so there is
 * no jarring flash.
 */
export function useTimeOfDay(): TimeOfDay {
  return useSyncExternalStore<TimeOfDay>(
    subscribe,
    () => resolveTimeOfDay(),
    () => 'morning',
  );
}
