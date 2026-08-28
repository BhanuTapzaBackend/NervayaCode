import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { ConflictError, handleError } from '@/lib/utils/error.util';
import { sendOtp } from '@/lib/services/otp';
import { OTP_PURPOSE } from '@/lib/constants/enums';
import { assertUsablePhone } from '@/lib/services/auth/phone-link.service';
import { resolvePhoneClaim } from '@/lib/services/auth/account-merge.service';
import { checkLoginRateLimit } from '@/lib/utils/rate-limit.util';
import { getClientIp } from '@/lib/utils/request.util';

/**
 * Sends a verification code to a number the signed-in user wants to add.
 *
 * Authenticated on purpose: `link_phone` writes to an existing account, so it
 * must never be reachable from the public /api/auth/otp/* endpoints.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const { phone } = body as { phone?: unknown };

    if (typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json(errorResponse('Phone number is required', null, 400), { status: 400 });
    }

    const normalized = assertUsablePhone(phone);

    // Keyed on ip+phone like /api/auth/login, so one abusive client cannot
    // enumerate numbers or burn the WhatsApp send budget.
    const ip = getClientIp(request);
    if (!(await checkLoginRateLimit(`${ip}:${normalized}`))) {
      return NextResponse.json(errorResponse('Too many attempts. Please try again later.', null, 429), { status: 429 });
    }

    // A number owned by someone else is no longer a flat refusal. If that
    // account is one this user can prove they own, offer to combine them
    // instead of dead-ending them mid-checkout.
    const claim = await resolvePhoneClaim(normalized, authResult.user.userId);
    if (claim.status === 'blocked') {
      throw new ConflictError(claim.reason ?? 'That number cannot be linked to this account.');
    }

    const result = await sendOtp(normalized, OTP_PURPOSE.LINK_PHONE, ip);
    if (!result.success) {
      return NextResponse.json(
        errorResponse(result.message ?? 'Could not send the verification code', null, result.statusCode),
        { status: result.statusCode },
      );
    }

    // `merge` rides the SUCCESS body deliberately: `errorResponse` hard-codes
    // `data: null` and discards its second argument, so a flag on an error
    // response would never reach the client (the same constraint that made the
    // phone gate signal by status code alone).
    return NextResponse.json(
      successResponse('Verification code sent', { phone: normalized, merge: claim.status === 'mergeable' }),
      { status: 200 },
    );
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
