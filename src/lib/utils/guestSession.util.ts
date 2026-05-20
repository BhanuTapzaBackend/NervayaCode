import { randomBytes } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAMES, getGuestCookieOptions } from '@/utils/cookieConstants';

export function generateGuestSessionId(): string {
  return `gst_${randomBytes(24).toString('hex')}`;
}

export function readGuestSessionId(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_NAMES.GUEST_SESSION)?.value ?? null;
}

export function setGuestSessionCookie(response: NextResponse, guestSessionId: string): void {
  response.cookies.set(COOKIE_NAMES.GUEST_SESSION, guestSessionId, getGuestCookieOptions());
}

export function clearGuestSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAMES.GUEST_SESSION, '', {
    ...getGuestCookieOptions(),
    maxAge: 0,
  });
}
