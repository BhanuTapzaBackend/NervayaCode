'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/constants/roles';
import {
  AUTH_ROUTES,
  ADMIN_ROUTES,
  PROTECTED_ROUTES,
  CUSTOMER_ONLY_ROUTES,
  THERAPIST_ROUTES,
  ROUTES,
  isProtectedPath,
} from '@/utils/routesConstants';
import { validateReturnUrl } from '@/utils/returnUrl';
import LoadingScreen from '@/components/AuthGuard/LoadingScreen';

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

function getDefaultRouteForRole(role: string | undefined): string {
  if (role === ROLES.ADMIN) return ROUTES.ADMIN_DASHBOARD;
  if (role === ROLES.THERAPIST) return ROUTES.THERAPIST_DASHBOARD;
  return ROUTES.DASHBOARD;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { initializing, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (initializing) return;

    if (isAuthRoute(pathname)) {
      return;
    }

    if (isProtectedPath(pathname) && !isAuthenticated) {
      const safeReturn = validateReturnUrl(pathname);
      const loginUrl = safeReturn ? `${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(safeReturn)}` : ROUTES.LOGIN;
      router.replace(loginUrl);
      return;
    }

    if (ADMIN_ROUTES.some((route) => pathname.startsWith(route)) && isAuthenticated && user?.role !== ROLES.ADMIN) {
      router.replace(getDefaultRouteForRole(user?.role));
      return;
    }

    if (
      THERAPIST_ROUTES.some((route) => pathname.startsWith(route)) &&
      isAuthenticated &&
      user?.role !== ROLES.THERAPIST
    ) {
      router.replace(getDefaultRouteForRole(user?.role));
      return;
    }

    if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && isAuthenticated && user?.role === ROLES.ADMIN) {
      router.replace(ROUTES.ADMIN_DASHBOARD);
      return;
    }

    if (
      CUSTOMER_ONLY_ROUTES.some((route) => pathname.startsWith(route)) &&
      isAuthenticated &&
      user?.role === ROLES.ADMIN
    ) {
      router.replace(ROUTES.ADMIN_DASHBOARD);
    }
  }, [initializing, isAuthenticated, user?.role, pathname, router]);

  if (initializing) {
    return <LoadingScreen />;
  }

  // Hold the loader while a redirect is in flight so unauthenticated visitors
  // never see the protected shell (nav + page body) between the useEffect
  // firing router.replace() and React actually navigating.
  const onProtectedPath = isProtectedPath(pathname);
  if (onProtectedPath && !isAuthenticated) {
    return <LoadingScreen />;
  }
  if (isAuthenticated) {
    if (ADMIN_ROUTES.some((route) => pathname.startsWith(route)) && user?.role !== ROLES.ADMIN) {
      return <LoadingScreen />;
    }
    if (THERAPIST_ROUTES.some((route) => pathname.startsWith(route)) && user?.role !== ROLES.THERAPIST) {
      return <LoadingScreen />;
    }
    if (
      (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) ||
        CUSTOMER_ONLY_ROUTES.some((route) => pathname.startsWith(route))) &&
      user?.role === ROLES.ADMIN
    ) {
      return <LoadingScreen />;
    }
  }

  return <>{children}</>;
}
