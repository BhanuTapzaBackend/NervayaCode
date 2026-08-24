export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/about-us',
  '/privacy-policy',
  '/support',
  '/therapy-corner',
  '/sleep-assessment',
  // Shared meeting room — reachable by both customers and therapists. Listing it here lets the
  // THERAPIST role past the middleware role gate; access is enforced by the jitsi-token API, not the route.
  '/session',
  // Free 1-on-1 consultation room — public/anonymous (leads are not logged in). Access is gated by
  // the unguessable lead id, enforced in the consultations jitsi-token API.
  '/consultation',
] as const;

export const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/account',
  '/checkout',
  '/order-success',
  // Requires auth (logged-out users are redirected to login) but is not role-restricted.
  '/session',
] as const;

export const ADMIN_ROUTES = ['/admin'] as const;

/** Routes accessible only by users with THERAPIST role */
export const THERAPIST_ROUTES = ['/therapist'] as const;

export const AUTH_ROUTES = ['/login', '/signup'] as const;

export const CUSTOMER_ONLY_ROUTES = [
  '/dashboard',
  '/sleep-blog',
  '/sleep-supplements',
  '/deep-rest',
  '/drift-off',
  '/therapy-corner',
  '/support',
  '/sleep-assessment',
  '/account',
  '/profile',
] as const;

export function isProtectedPath(pathname: string): boolean {
  return (
    PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) ||
    ADMIN_ROUTES.some((route) => pathname.startsWith(route)) ||
    THERAPIST_ROUTES.some((route) => pathname.startsWith(route))
  );
}

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  THERAPIST_DASHBOARD: '/therapist/dashboard',
  DEEP_REST: '/deep-rest',
  ADMIN_DEEP_REST: '/admin/deep-rest',
  SUPPLEMENTS: '/sleep-supplements',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDER_SUCCESS: '/order-success',
} as const;
