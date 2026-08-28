// Import from jose subpaths (not the barrel) so the JWE/deflate code path —
// which pulls CompressionStream and breaks the Edge Runtime — is never bundled.
// This module only does HS256 sign/verify (JWS), so it needs nothing else.
import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import { Role } from '../constants/roles';
import { COOKIE_OPTIONS } from '@/utils/cookieConstants';

if (!process.env.JWT_SECRET) {
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  if (process.env.NODE_ENV === 'production' && !isCI) {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-fallback-secret-key-change-in-production');

/**
 * Token lifetime, derived from the cookie's max-age so the two cannot drift.
 *
 * If the cookie outlived the token the user would look signed in while every
 * request 401'd; if the token outlived the cookie it would stay replayable
 * after the browser had forgotten it. Same number, one place.
 *
 * `JWT_EXPIRES_IN` still overrides for ops, but a mismatch is a real hazard,
 * so it warns rather than silently disagreeing.
 */
/** "5d" / "3h" / "90m" / "600s" / bare seconds -> seconds, or null. */
function parseDurationSeconds(value: string): number | null {
  const match = value.trim().match(/^(\d+)\s*([smhd])?$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1;
  return amount * multiplier;
}

/**
 * Effective token lifetime in SECONDS.
 *
 * Compared numerically, not as strings: the previous guard tested
 * `'5d' !== '432000s'` and so warned on every cold start about two identical
 * durations — the fastest way to train everyone to ignore a warning.
 */
const TOKEN_TTL_SECONDS = (() => {
  const override = process.env.JWT_EXPIRES_IN?.trim();
  if (!override) return COOKIE_OPTIONS.AUTH_TOKEN_MAX_AGE;

  const parsed = parseDurationSeconds(override);
  if (parsed === null) {
    console.warn(`[auth] JWT_EXPIRES_IN="${override}" is not a duration. Falling back to the cookie's max-age.`);
    return COOKIE_OPTIONS.AUTH_TOKEN_MAX_AGE;
  }
  if (parsed !== COOKIE_OPTIONS.AUTH_TOKEN_MAX_AGE) {
    console.warn(
      `[auth] JWT_EXPIRES_IN=${override} (${parsed}s) does not match the auth cookie's max-age ` +
        `(${COOKIE_OPTIONS.AUTH_TOKEN_MAX_AGE}s). Sessions end at whichever expires first; ` +
        `if the cookie outlives the token the user looks signed in while every request 401s. ` +
        `Unset JWT_EXPIRES_IN to keep them in sync.`,
    );
  }
  return parsed;
})();

const JWT_EXPIRES_IN = `${TOKEN_TTL_SECONDS}s`;

/**
 * Audience for session cookies.
 *
 * Every token this app signs uses the same JWT_SECRET, so a signature check
 * alone does not say WHICH kind of token it is. The OAuth `state` token is
 * handed out publicly by /api/auth/google/start — without an audience claim it
 * verified cleanly as a session cookie, yielding `{userId: undefined}` and
 * passing requireAuth. Both sides must be stamped and checked.
 */
const SESSION_AUDIENCE = 'nervaya-session';

export async function generateToken(userId: string, role: string): Promise<string> {
  const alg = 'HS256';
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg })
    .setAudience(SESSION_AUDIENCE)
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

export interface VerifiedToken {
  userId: string;
  role: Role;
  /** Expiry, in seconds since the epoch. Used to decide about sliding renewal. */
  exp?: number;
}

export async function verifyToken(token: string): Promise<VerifiedToken | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Deliberately NOT `jwtVerify(..., { audience })`.
    //
    // That option treats a MISSING `aud` as a failure, and every token issued
    // before this claim existed has none — so turning it on would reject every
    // live session at once on deploy. Sessions last five days and the only
    // response to a failed verify is to delete the cookie, so that is a
    // site-wide forced logout, hitting people mid-checkout.
    //
    // Checking the claim only when present is just as strong for the attack
    // this guards: the OAuth state token is publicly obtainable from
    // /api/auth/google/start and signed with the same secret, and it is
    // rejected here twice over — its `aud` is the state audience, and its
    // payload carries no userId/role for the check below.
    //
    // TODO: switch to the strict `{ audience: SESSION_AUDIENCE }` option once
    // this has been deployed for longer than AUTH_TOKEN_MAX_AGE (5 days), by
    // which point no aud-less token can still be valid.
    if (payload.aud !== undefined && payload.aud !== SESSION_AUDIENCE) return null;

    // The cast alone validates nothing. A token that is correctly signed but
    // carries no userId would otherwise flow into `User.findById(undefined)`,
    // which Mongoose casts to an empty filter rather than rejecting.
    const userId = typeof payload.userId === 'string' ? payload.userId : '';
    const role = typeof payload.role === 'string' ? payload.role : '';
    if (!userId || !role) return null;

    return { userId, role: role as Role, exp: typeof payload.exp === 'number' ? payload.exp : undefined };
  } catch (_error) {
    return null;
  }
}

/**
 * True once a token is past the halfway point of its life.
 *
 * Renewing on every request would reset the cookie constantly for no benefit;
 * renewing only near the end leaves a window where an active user is logged out
 * mid-action. Halfway is the usual compromise: an active user is silently kept
 * signed in, an idle one still ages out on schedule.
 */
export function shouldRenewToken(exp?: number): boolean {
  if (!exp) return false;
  const remainingSeconds = exp - Math.floor(Date.now() / 1000);
  // Measured against the TOKEN's own lifetime, not the cookie's. With a shorter
  // JWT_EXPIRES_IN the cookie-based threshold was always satisfied, so every
  // /api/auth/me re-signed the token forever.
  return remainingSeconds < TOKEN_TTL_SECONDS / 2;
}
