'use client';

import { useEffect } from 'react';

/**
 * Scrolls to the element matching the current URL hash after the page mounts.
 *
 * Native App Router hash scrolling fires before client sections finish
 * mounting (and before fade-in animations / images settle the layout), so it
 * often lands in the wrong place or not at all. This re-runs the scroll a few
 * times as the layout stabilizes.
 */
export function HashScroll(): null {
  useEffect(() => {
    const { hash } = window.location;
    if (!hash) return;

    const id = decodeURIComponent(hash.slice(1));
    let cancelled = false;

    const scrollToTarget = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const raf = requestAnimationFrame(scrollToTarget);
    const timers = [setTimeout(scrollToTarget, 400), setTimeout(scrollToTarget, 900)];

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}

export default HashScroll;
