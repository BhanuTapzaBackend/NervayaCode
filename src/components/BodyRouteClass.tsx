'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function BodyRouteClass() {
  const pathname = usePathname();

  useEffect(() => {
    const isHomeRoute = pathname === '/';
    document.body.classList.toggle('route-home', isHomeRoute);
    document.body.classList.toggle('route-non-home', !isHomeRoute);
  }, [pathname]);

  return null;
}
