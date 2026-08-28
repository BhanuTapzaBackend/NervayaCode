/** Placeholder origin — any URL that resolves away from it is not same-site. */
const SENTINEL_ORIGIN = 'https://placeholder.invalid';

/**
 * Narrows a user-supplied `returnUrl` to a same-origin path, or null.
 *
 * PARSED, not pattern-matched. The previous version tested
 * `startsWith('//') || includes('://')`, which missed the backslash: WHATWG URL
 * treats `\` as `/` at path-start for special schemes, so `/\evil.com` passed
 * the check and then resolved to `https://evil.com/` — an open redirect
 * reachable from `/login?returnUrl=`, the middleware, and the OAuth callback.
 * Signing the value into the OAuth state did not help, because both the sign
 * and verify sides called this same function.
 *
 * Letting the URL parser decide means anything the browser would treat as
 * cross-origin is rejected by construction, rather than by a blocklist that has
 * to anticipate every encoding.
 */
export function validateReturnUrl(value: string | null | undefined): string | null {
  if (value == null || typeof value !== 'string') return null;

  const candidate = value.trim();
  if (candidate === '' || !candidate.startsWith('/')) return null;

  try {
    const url = new URL(candidate, SENTINEL_ORIGIN);
    // A protocol-relative, backslash-prefixed or absolute URL resolves to some
    // other origin; only a genuine path stays on the sentinel.
    if (url.origin !== SENTINEL_ORIGIN) return null;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
