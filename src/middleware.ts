import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt.util';
import { COOKIE_NAMES } from '@/utils/cookieConstants';
import { ROLES } from '@/lib/constants/enums';
import {
  PUBLIC_ROUTES,
  THERAPIST_ROUTES,
  ADMIN_ROUTES,
  CUSTOMER_ONLY_ROUTES,
  ROUTES,
  isProtectedPath,
} from '@/utils/routesConstants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.indexOf('.') !== -1 ||
    pathname === '/icon'
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => (route === '/' ? pathname === '/' : pathname.startsWith(route)));

  const token = request.cookies.get(COOKIE_NAMES.AUTH_TOKEN)?.value;
  const decoded = token ? await verifyToken(token) : null;

  let response: NextResponse;

  if (decoded && (pathname === ROUTES.LOGIN || pathname === ROUTES.SIGNUP)) {
    let redirectUrl: string = ROUTES.DASHBOARD;
    if (decoded.role === ROLES.THERAPIST) {
      redirectUrl = ROUTES.THERAPIST_DASHBOARD;
    } else if (decoded.role === ROLES.ADMIN) {
      redirectUrl = ROUTES.ADMIN_DASHBOARD;
    }
    response = NextResponse.redirect(new URL(redirectUrl, request.url));
  } else if (!decoded && isProtectedPath(pathname)) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    response = NextResponse.redirect(loginUrl);
  } else if (!decoded) {
    response = NextResponse.next();
  } else if (decoded) {
    const role = decoded.role;

    if (role === ROLES.THERAPIST) {
      const isTherapistRoute = THERAPIST_ROUTES.some((route) => pathname.startsWith(route));
      const isCustomerOnly = CUSTOMER_ONLY_ROUTES.some((route) => pathname.startsWith(route));
      if (isCustomerOnly || (!isTherapistRoute && !isPublicRoute)) {
        response = NextResponse.redirect(new URL(ROUTES.THERAPIST_DASHBOARD, request.url));
      } else {
        response = NextResponse.next();
      }
    } else if (role === ROLES.CUSTOMER) {
      const isTherapistPath = THERAPIST_ROUTES.some((route) => pathname.startsWith(route));
      const isAdminPath = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
      if (isTherapistPath || isAdminPath) {
        response = NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
      } else {
        response = NextResponse.next();
      }
    } else if (role === ROLES.ADMIN) {
      const isCustomerOnly = CUSTOMER_ONLY_ROUTES.some((route) => pathname.startsWith(route));
      const isTherapistPath = THERAPIST_ROUTES.some((route) => pathname.startsWith(route));
      if (isCustomerOnly || isTherapistPath) {
        response = NextResponse.redirect(new URL(ROUTES.ADMIN_DASHBOARD, request.url));
      } else {
        response = NextResponse.next();
      }
    } else {
      response = NextResponse.next();
    }
  } else {
    response = NextResponse.next();
  }

  const isProduction = process.env.NODE_ENV === 'production';
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (isProduction) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon).*)'],
};
