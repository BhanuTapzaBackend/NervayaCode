import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { verifyOtp } from '@/lib/services/otp';
import { OTP_PURPOSE } from '@/lib/constants/enums';
import { assertUsablePhone, attachPhoneToUser } from '@/lib/services/auth/phone-link.service';
import { mergeAccountByPhone, resolvePhoneClaim } from '@/lib/services/auth/account-merge.service';
import { createSessionForUser } from '@/lib/services/auth.service';
import { COOKIE_NAMES, getSecureCookieOptions } from '@/utils/cookieConstants';
import { getClientIp } from '@/lib/utils/request.util';
import User from '@/lib/models/user.model';

/**
 * Verifies the code and attaches the number to the signed-in account.
 *
 * Re-issues the session cookie afterwards: the user object changes (phone,
 * phoneVerified, authProviders), and going back through `createSessionForUser`
 * also re-runs therapist-role resolution, keeping this consistent with every
 * other way a session is minted.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const { phone, code } = body as { phone?: unknown; code?: unknown };

    if (typeof phone !== 'string' || typeof code !== 'string' || !phone.trim() || !code.trim()) {
      return NextResponse.json(errorResponse('Phone and code are required', null, 400), { status: 400 });
    }

    const normalized = assertUsablePhone(phone);
    const ip = getClientIp(request);

    const result = await verifyOtp(normalized, code, OTP_PURPOSE.LINK_PHONE, ip);
    if (!result.success) {
      return NextResponse.json(errorResponse(result.message ?? 'Could not verify that code', null, result.statusCode), {
        status: result.statusCode,
      });
    }

    // The OTP has now proven control of this number — which in a passwordless
    // system is exactly the credential that logs into the account owning it. So
    // if another account holds it, this user has authenticated as both sides
    // and the two can be combined.
    //
    // Re-resolved AFTER verification, never trusted from the client: the merge
    // target is derived from the proven number, so a caller cannot point this
    // at an account it has not proven it owns.
    const claim = await resolvePhoneClaim(normalized, authResult.user.userId);
    if (claim.status === 'mergeable') {
      await mergeAccountByPhone(authResult.user.userId, normalized);
    }

    const user =
      claim.status === 'mergeable'
        ? await User.findById(authResult.user.userId)
        : await attachPhoneToUser(authResult.user.userId, normalized);

    if (!user) {
      return NextResponse.json(errorResponse('Account not found', null, 404), { status: 404 });
    }

    // Stamp the number onto the existing Email-keyed lead now. Leaving it until
    // the next Phone-keyed push would create a second lead for the same person.
    // Fire-and-forget: a CRM outage must never fail a verification.
    const { pushSignupLeadToZoho } = await import('@/lib/zoho/zoho-crm.service');
    pushSignupLeadToZoho(user.name, user.email ?? undefined, normalized).catch(() => undefined);

    const session = await createSessionForUser(user);

    const response = NextResponse.json(successResponse('WhatsApp number verified', { user: session.user }), {
      status: 200,
    });
    response.cookies.set(COOKIE_NAMES.AUTH_TOKEN, session.token, getSecureCookieOptions());

    return response;
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
