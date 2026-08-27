'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function BodyRouteClass() {
  const pathname = usePathname();

  useEffect(() => {
    const isHomeRoute = pathname === '/';
    document.body.classList.toggle('route-home', isHomeRoute);
    document.body.classList.toggle('route-non-home', !isHomeRoute);
    // globals.css reserves space for the fixed global navbar with
    // `body { padding-top: var(--navbar-height) !important }`. The therapist
    // area has no global navbar, so that padding is a dead band at the top.
    document.body.classList.toggle('route-therapist', pathname.startsWith('/therapist'));
  }, [pathname]);

  return null;
}
