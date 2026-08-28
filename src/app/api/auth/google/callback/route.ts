import { NextRequest, NextResponse } from 'next/server';

import { exchangeCodeForIdToken, verifyGoogleIdToken } from '@/lib/utils/google-oauth.util';
import { verifyOAuthState } from '@/lib/utils/oauth-state.util';
import { GoogleEmailConflictError, resolveGoogleIdentity } from '@/lib/services/auth/google-identity.service';
import { createSessionForUser } from '@/lib/services/auth.service';
import { attemptGuestClaim } from '@/lib/services/guestSleepAssessment.service';
import { COOKIE_NAMES, getSecureCookieOptions, getOAuthStateCookieOptions } from '@/utils/cookieConstants';
import { validateReturnUrl } from '@/utils/returnUrl';

/** Generic codes only — never echo Google's error text back to the browser. */
function failure(request: NextRequest, code: string): NextResponse {
  const response = NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
  response.cookies.set(COOKIE_NAMES.OAUTH_STATE, '', { ...getOAuthStateCookieOptions(), maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // The user pressed "Cancel" on Google's consent screen.
  if (params.get('error')) return failure(request, 'google_cancelled');

  const code = params.get('code');
  if (!code) return failure(request, 'google_failed');

  const verifiedState = await verifyOAuthState(
    params.get('state') ?? undefined,
    request.cookies.get(COOKIE_NAMES.OAUTH_STATE)?.value,
  );
  if (!verifiedState) return failure(request, 'google_state');

  try {
    const idToken = await exchangeCodeForIdToken(code);
    const profile = await verifyGoogleIdToken(idToken);

    const { user, isFirstTime } = await resolveGoogleIdentity(profile);
    // Mints the token AFTER therapist-role resolution, so a therapist signing in
    // with their @nervaya.com account lands on the therapist dashboard first try.
    const session = await createSessionForUser(user);

    // Re-validate even though it came from a token we signed: defence in depth
    // costs nothing here.
    const returnUrl = validateReturnUrl(verifiedState.returnUrl);

    const destination = new URL('/auth/callback', request.url);
    if (returnUrl) destination.searchParams.set('returnUrl', returnUrl);
    if (isFirstTime) destination.searchParams.set('new', '1');

    // Land on a PUBLIC page, not straight on the dashboard. `auth_token` is
    // SameSite=Strict, and this redirect is the tail of a cross-site navigation
    // chain from accounts.google.com — the browser stores the cookie but will
    // not SEND it on that hop, so a protected destination would bounce the
    // freshly-authenticated user back to /login. The callback page then calls
    // /api/auth/me as a same-site XHR, which does carry the cookie.
    const response = NextResponse.redirect(destination);

    response.cookies.set(COOKIE_NAMES.AUTH_TOKEN, session.token, getSecureCookieOptions());
    response.cookies.set(COOKIE_NAMES.OAUTH_STATE, '', { ...getOAuthStateCookieOptions(), maxAge: 0 });

    // Carry over anything completed while logged out (e.g. a sleep assessment).
    await attemptGuestClaim(request, response, session.user._id);

    return response;
  } catch (error) {
    if (error instanceof GoogleEmailConflictError) {
      return failure(request, 'google_email_conflict');
    }
    return failure(request, 'google_failed');
  }
}
