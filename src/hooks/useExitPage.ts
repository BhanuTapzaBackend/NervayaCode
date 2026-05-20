'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackExitPage } from '@/utils/analytics';

export function useExitPage(): void {
  const pathname = usePathname();
  const entryTimeRef = useRef(0);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    entryTimeRef.current = Date.now();
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const timeOnPage = Math.round((Date.now() - entryTimeRef.current) / 1000);
        trackExitPage({ page_path: pathnameRef.current, time_on_page_seconds: timeOnPage });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
}
