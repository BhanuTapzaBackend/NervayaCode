export const COOKIE_NAMES = {
  AUTH_TOKEN: 'auth_token',
  GUEST_SESSION: 'guest_session_id',
  /** Short-lived CSRF nonce for the Google OAuth round trip. */
  OAUTH_STATE: 'g_oauth_state',
} as const;

export const AUTH_STORAGE_KEYS = {
  AUTH_USER: 'nervaya_auth_user',
  AUTH_EXPIRES_AT: 'nervaya_auth_expires_at',
  IS_LOGGED_IN: 'isLoggedIn',
} as const;

/**
 * sessionStorage keys holding the login wizard's position, so a page refresh
 * mid-OTP doesn't drop the user back to the phone step.
 *
 * Logout MUST clear these: they outlive the auth cookie otherwise, and the next
 * visit to /login restores the OTP step with a stale resend countdown.
 */
export const AUTH_FLOW_STORAGE_KEYS = {
  STEP: 'nervaya_auth_step',
  PURPOSE: 'nervaya_auth_purpose',
  OTP_EXPIRES_AT: 'nervaya_auth_otpExpiresAt',
  /**
   * Separate cooldown for the add-a-number flow. It MUST NOT share
   * OTP_EXPIRES_AT: an in-progress login countdown would suppress the resend
   * button here, and vice versa.
   */
  LINK_PHONE_OTP_EXPIRES_AT: 'nervaya_linkphone_otpExpiresAt',
} as const;

export const COOKIE_OPTIONS = {
  /**
   * How long a login lasts. THE single source of truth for session duration —
   * the JWT's own expiry and the localStorage expiry in AuthContext are both
   * derived from this, because three independent constants that merely happen
   * to agree is how you end up with a cookie that outlives its token (user
   * looks logged in, every request 401s).
   */
  AUTH_TOKEN_MAX_AGE: 5 * 24 * 60 * 60,
  GUEST_SESSION_MAX_AGE: 30 * 24 * 60 * 60,
  /** Long enough to pick an account and consent; short enough to be worthless if leaked. */
  OAUTH_STATE_MAX_AGE: 10 * 60,
} as const;

export function getSecureCookieOptions(isProduction: boolean = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: COOKIE_OPTIONS.AUTH_TOKEN_MAX_AGE,
  };
}

/**
 * Cookie options for the OAuth CSRF nonce.
 *
 * `sameSite: 'lax'` is REQUIRED here and is not a relaxation of `auth_token`.
 * Google returns the user via a cross-site top-level navigation, and a Strict
 * cookie is not sent on one — the callback would find nothing to compare the
 * signed `state` against, defeating the CSRF check entirely.
 *
 * Path-scoped so it never rides along on any other request.
 */
export function getOAuthStateCookieOptions(isProduction: boolean = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/api/auth/google',
    maxAge: COOKIE_OPTIONS.OAUTH_STATE_MAX_AGE,
  };
}

export function getGuestCookieOptions(isProduction: boolean = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_OPTIONS.GUEST_SESSION_MAX_AGE,
  };
}
