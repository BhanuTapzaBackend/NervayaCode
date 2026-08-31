'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/utils/analytics';

/**
 * Fires `page_view` on every route change.
 *
 * The App Router only paints one document, so a client-side navigation produces
 * no new page load and nothing sends a page_view on its own. GTM's History
 * Change trigger can cover this, but relying on container config left the app
 * with no page views at all — so it is sent explicitly here.
 */
export function usePageView(): void {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSentRef = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    // Guard against double-firing under React Strict Mode and re-renders that
    // leave the URL unchanged.
    if (lastSentRef.current === url) return;
    lastSentRef.current = url;

    trackPageView({
      page_url: url,
      page_type: pathname,
      ...(document.referrer ? { traffic_source: document.referrer } : {}),
    });
  }, [pathname, searchParams]);
}
