import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import { randomBytes } from 'crypto';

/**
 * CSRF protection for the Google OAuth round trip.
 *
 * Two independent checks, both required:
 *
 *  1. The `state` parameter is a signed JWT, so an attacker cannot forge one.
 *  2. It carries a nonce that must match a cookie set on the same browser, so a
 *     signed state leaked through browser history or a Referer header cannot be
 *     replayed from somewhere else.
 *
 * A signed state ALONE is not enough — it is a bearer value that travels in a
 * URL. The cookie is what binds it to this browser.
 *
 * PKCE is deliberately absent: this is a confidential client (the exchange is
 * server-side with a client secret), so state + nonce is the appropriate
 * defence. Add PKCE only if this ever becomes a public client.
 */

// Subpath imports, matching jwt.util.ts — the barrel import is not Edge-safe
// and these helpers must stay usable from either runtime.
const STATE_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-fallback-secret-key-change-in-production');

/**
 * A distinct audience from the session token. Without this, a state token would
 * verify against `verifyToken` and could be presented as a session cookie.
 */
const STATE_AUDIENCE = 'google-oauth-state';
const STATE_TTL = '10m';

export interface OAuthStatePayload {
  nonce: string;
  returnUrl?: string;
}

/** Cryptographically random, URL-safe. Mirrors guestSession.util.ts. */
export function createNonce(): string {
  return randomBytes(32).toString('base64url');
}

export async function signOAuthState(payload: OAuthStatePayload): Promise<string> {
  return new SignJWT({ nonce: payload.nonce, returnUrl: payload.returnUrl })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(STATE_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(STATE_TTL)
    .sign(STATE_SECRET);
}

/**
 * Verifies signature, expiry and audience, then binds the state to this browser
 * by requiring the embedded nonce to equal the one in the cookie.
 *
 * Returns null on ANY failure — callers redirect to a generic error rather than
 * telling the caller which check failed.
 */
export async function verifyOAuthState(state: string | undefined, cookieNonce: string | undefined) {
  if (!state || !cookieNonce) return null;

  try {
    const { payload } = await jwtVerify(state, STATE_SECRET, { audience: STATE_AUDIENCE });
    const nonce = typeof payload.nonce === 'string' ? payload.nonce : '';

    // Length check first so the comparison below is between equal-length values.
    if (nonce.length !== cookieNonce.length || nonce !== cookieNonce) return null;

    return {
      nonce,
      returnUrl: typeof payload.returnUrl === 'string' ? payload.returnUrl : undefined,
    };
  } catch {
    return null;
  }
}
