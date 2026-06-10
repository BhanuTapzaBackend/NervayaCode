import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/utils/response.util';
import type { SendOtpResult } from '@/lib/services/otp';

/**
 * Map a failed OTP-send result to a NextResponse, attaching the rate-limit
 * `otpSendCount` when present. Shared by signup, login, and otp/send so the
 * failure shape (status + message + count) stays consistent across routes.
 */
export function otpSendErrorResponse(result: SendOtpResult): NextResponse {
  const body = {
    ...errorResponse(result.message ?? 'Failed to send OTP', null, result.statusCode),
    ...(result.sendCount !== undefined && { data: { otpSendCount: result.sendCount } }),
  };
  return NextResponse.json(body, { status: result.statusCode });
}
