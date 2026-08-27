'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** Matches the shell's mobile breakpoint. Keep in sync with the CSS. */
const NARROW_QUERY = '(max-width: 860px)';

/**
 * True on viewports where the shell switches to its mobile layout.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: a media query IS
 * an external store, so subscribing to it directly avoids the cascading render
 * that setting state from an effect causes, and `getServerSnapshot` keeps SSR
 * and hydration agreeing on the first paint.
 */
export function useIsNarrowViewport(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const media = window.matchMedia(NARROW_QUERY);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW_QUERY).matches,
    // The server has no viewport; assume desktop and let the client correct it.
    () => false,
  );
}
