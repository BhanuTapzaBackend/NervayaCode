import { NextRequest } from 'next/server';

/**
 * Resolve the client IP from proxy headers, falling back to 'unknown'.
 * Used as the base for per-client rate-limit buckets across auth routes.
 */
export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
}
