import api from '@/lib/axios';
import { AUTH_API } from '@/lib/constants/api.constants';
import type { OtpPurpose } from '@/types/auth.types';
import type { ApiResponse } from '@/lib/utils/response.util';

interface SendOtpResponse {
  success: boolean;
  message: string;
  /** `merge` is set only by the phone-link route; see its comment on why it
   *  rides the success body rather than an error one. */
  data?: { otpSendCount?: number; merge?: boolean };
  statusCode: number;
}

interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data?: { user: unknown; token: string };
  statusCode: number;
}

export async function sendOtp(phone: string, purpose: OtpPurpose): Promise<ApiResponse<{ otpSendCount?: number }>> {
  const res = (await api.post(AUTH_API.OTP_SEND, { phone, purpose })) as SendOtpResponse;
  return {
    success: res.success,
    message: res.message,
    data: res.data ?? undefined,
    statusCode: res.statusCode,
  };
}

export async function verifyOtp(
  phone: string,
  code: string,
  purpose: OtpPurpose,
): Promise<ApiResponse<{ user: unknown; token: string } | undefined>> {
  const res = (await api.post(AUTH_API.OTP_VERIFY, { phone, code, purpose })) as VerifyOtpResponse;
  return {
    success: res.success,
    message: res.message,
    data: res.data,
    statusCode: res.statusCode,
  };
}

/**
 * Sends a code to a number the signed-in user wants to add to their account.
 * Distinct from `sendOtp`: this endpoint requires a session, because it is
 * about to write to an existing account.
 */
export async function sendLinkPhoneOtp(
  phone: string,
): Promise<ApiResponse<{ otpSendCount?: number; merge?: boolean }>> {
  const res = (await api.post(AUTH_API.PHONE_START, { phone })) as SendOtpResponse;
  return {
    success: res.success,
    message: res.message,
    data: res.data ?? undefined,
    statusCode: res.statusCode,
  };
}

/**
 * Verifies the code and attaches the number.
 *
 * Returns only the refreshed user — the session cookie is re-set by the server
 * as httpOnly, so there is no token for the client to hold.
 */
export async function verifyLinkPhoneOtp(phone: string, code: string): Promise<ApiResponse<{ user: unknown }>> {
  const res = (await api.post(AUTH_API.PHONE_VERIFY, { phone, code })) as {
    success: boolean;
    message: string;
    data?: { user: unknown };
    statusCode: number;
  };
  return {
    success: res.success,
    message: res.message,
    data: res.data,
    statusCode: res.statusCode,
  };
}
