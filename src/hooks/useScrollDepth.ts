'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackScrollDepth, type ScrollDepthThreshold } from '@/utils/analytics';

const THRESHOLDS: ScrollDepthThreshold[] = [25, 50, 75, 90];

export function useScrollDepth(): void {
  const pathname = usePathname();
  const firedRef = useRef<Set<ScrollDepthThreshold>>(new Set());

  useEffect(() => {
    firedRef.current = new Set();

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPercent = (scrollTop / docHeight) * 100;

      for (const threshold of THRESHOLDS) {
        if (scrollPercent >= threshold && !firedRef.current.has(threshold)) {
          firedRef.current.add(threshold);
          trackScrollDepth({ percent_scrolled: threshold, page_type: pathname });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);
}
