import { createRemoteJWKSet } from 'jose/jwks/remote';
import { jwtVerify } from 'jose/jwt/verify';

/**
 * Google Sign-In for LOGIN ONLY.
 *
 * Deliberately hand-rolled on fetch + jose rather than the `googleapis` client:
 * login needs exactly three operations (build an authorize URL, POST for
 * tokens, verify an ID token), jose already ships remote JWKS verification and
 * is already a dependency, and `googleapis` is a large CJS package that would
 * tax every cold start on the login path.
 *
 * Scopes here are the non-sensitive identity set. Calendar access is a separate
 * concern with its own credentials (a domain-wide-delegated service account) and
 * must never be requested from this flow.
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

const SCOPES = ['openid', 'email', 'profile'].join(' ');

// Module-level so the JWKS is fetched once and cached across requests in a warm
// container, rather than on every login.
const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * The redirect URI, which Google matches byte-for-byte against the console.
 *
 * Deliberately NOT built from `getSiteUrl()`: that helper rewrites
 * `*.vercel.app` to the canonical brand domain and falls back to production
 * when unset. Correct for customer-facing links, actively wrong here — every
 * preview deploy would bounce the user to production mid-flow.
 */
export function getOAuthRedirectUri(): string {
  const explicit = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (explicit) return explicit;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) return `${appUrl.replace(/\/+$/, '')}/api/auth/google/callback`;

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3000/api/auth/google/callback';
  }
  throw new Error('GOOGLE_OAUTH_REDIRECT_URI must be set in production');
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv('GOOGLE_CLIENT_ID'),
    redirect_uri: getOAuthRedirectUri(),
    response_type: 'code',
    scope: SCOPES,
    state,
    // Login needs no refresh token. Requesting offline access would hand us a
    // long-lived credential we have no use for and would have to protect.
    access_type: 'online',
    // Let the user pick which Google account, without re-prompting for consent
    // they have already given.
    prompt: 'select_account',
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForIdToken(code: string): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: getOAuthRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed with ${response.status}`);
  }

  const data = (await response.json()) as { id_token?: string };
  if (!data.id_token) throw new Error('Google token response contained no id_token');

  return data.id_token;
}

/**
 * Verifies the ID token and returns the profile.
 *
 * `email_verified` is REQUIRED. Account linking matches an existing user by
 * email address, so accepting an unverified one would let anybody who can
 * create a Google account with someone else's address take over that account.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: GOOGLE_ISSUERS,
    audience: requireEnv('GOOGLE_CLIENT_ID'),
  });

  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const emailVerified = payload.email_verified === true;

  if (!sub) throw new Error('Google ID token contained no subject');
  if (!email) throw new Error('Google ID token contained no email');
  if (!emailVerified) throw new Error('Google account email is not verified');

  return {
    sub,
    email,
    name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : email.split('@')[0],
    picture: typeof payload.picture === 'string' ? payload.picture : '',
  };
}
