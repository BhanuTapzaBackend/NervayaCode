import { NextRequest, NextResponse } from 'next/server';

import { buildAuthorizeUrl } from '@/lib/utils/google-oauth.util';
import { createNonce, signOAuthState } from '@/lib/utils/oauth-state.util';
import { COOKIE_NAMES, getOAuthStateCookieOptions } from '@/utils/cookieConstants';
import { validateReturnUrl } from '@/utils/returnUrl';

/**
 * Begins Google sign-in.
 *
 * Responds with a 302 rather than JSON: an OAuth authorize request must be a
 * top-level browser navigation, so the client links straight here instead of
 * fetching it.
 *
 * The CSRF nonce is set as a cookie here and echoed inside the signed `state`;
 * the callback requires both to agree. See oauth-state.util.ts.
 */
export async function GET(request: NextRequest) {
  try {
    const returnUrl = validateReturnUrl(request.nextUrl.searchParams.get('returnUrl')) ?? undefined;

    const nonce = createNonce();
    const state = await signOAuthState({ nonce, returnUrl });

    const response = NextResponse.redirect(buildAuthorizeUrl(state));
    response.cookies.set(COOKIE_NAMES.OAUTH_STATE, nonce, getOAuthStateCookieOptions());

    return response;
  } catch {
    // Almost always missing GOOGLE_CLIENT_ID / redirect URI configuration.
    // Never surface the reason — it would advertise the deployment's config.
    return NextResponse.redirect(new URL('/login?error=google_unavailable', request.url));
  }
}
