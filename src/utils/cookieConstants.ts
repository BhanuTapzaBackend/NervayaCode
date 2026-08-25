export const COOKIE_NAMES = {
  AUTH_TOKEN: 'auth_token',
  GUEST_SESSION: 'guest_session_id',
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
} as const;

export const COOKIE_OPTIONS = {
  AUTH_TOKEN_MAX_AGE: 3 * 60 * 60,
  GUEST_SESSION_MAX_AGE: 30 * 24 * 60 * 60,
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

export function getGuestCookieOptions(isProduction: boolean = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_OPTIONS.GUEST_SESSION_MAX_AGE,
  };
}
