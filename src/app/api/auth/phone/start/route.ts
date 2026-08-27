import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { sendOtp } from '@/lib/services/otp';
import { OTP_PURPOSE } from '@/lib/constants/enums';
import { assertUsablePhone, assertPhoneAvailable } from '@/lib/services/auth/phone-link.service';
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

    // Fail before spending a message if the number belongs to someone else.
    await assertPhoneAvailable(normalized, authResult.user.userId);

    const result = await sendOtp(normalized, OTP_PURPOSE.LINK_PHONE, ip);
    if (!result.success) {
      return NextResponse.json(
        errorResponse(result.message ?? 'Could not send the verification code', null, result.statusCode),
        { status: result.statusCode },
      );
    }

    return NextResponse.json(successResponse('Verification code sent', { phone: normalized }), { status: 200 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
