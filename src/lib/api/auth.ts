import api from '@/lib/axios';
import { AUTH_API } from '@/lib/constants/api.constants';
import type { OtpPurpose } from '@/types/auth.types';
import type { ApiResponse } from '@/lib/utils/response.util';

interface SendOtpResponse {
  success: boolean;
  message: string;
  data?: { otpSendCount?: number };
  statusCode: number;
}

interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data?: { user: unknown; token: string };
  statusCode: number;
}

export async function sendOtp(email: string, purpose: OtpPurpose): Promise<ApiResponse<{ otpSendCount?: number }>> {
  const res = (await api.post(AUTH_API.OTP_SEND, { email, purpose })) as SendOtpResponse;
  return {
    success: res.success,
    message: res.message,
    data: res.data ?? undefined,
    statusCode: res.statusCode,
  };
}

export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose,
): Promise<ApiResponse<{ user: unknown; token: string } | undefined>> {
  const res = (await api.post(AUTH_API.OTP_VERIFY, { email, code, purpose })) as VerifyOtpResponse;
  return {
    success: res.success,
    message: res.message,
    data: res.data,
    statusCode: res.statusCode,
  };
}
