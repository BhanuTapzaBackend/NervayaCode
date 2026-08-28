'use client';

import { useState, useCallback } from 'react';
import { sendOtp as sendOtpApi, verifyOtp as verifyOtpApi, sendLinkPhoneOtp, verifyLinkPhoneOtp } from '@/lib/api/auth';
import { OTP_PURPOSE } from '@/lib/constants/enums';
import { getApiErrorMessage } from '@/lib/utils/apiError.util';
import type { OtpPurpose } from '@/types/auth.types';

interface UseOTPReturn {
  sendOtp: (phone: string, purpose: OtpPurpose) => Promise<boolean>;
  verifyOtp: (phone: string, code: string, purpose: OtpPurpose) => Promise<{ user: unknown; token: string } | null>;
  loading: boolean;
  error: string | null;
  sendCount: number | null;
  clearError: () => void;
}

export function useOTP(): UseOTPReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendCount, setSendCount] = useState<number | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const sendOtp = useCallback(async (phone: string, purpose: OtpPurpose): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSendCount(null);
    try {
      // link_phone writes to an existing account, so it goes through the
      // authenticated endpoint rather than the public OTP one.
      const res = purpose === OTP_PURPOSE.LINK_PHONE ? await sendLinkPhoneOtp(phone) : await sendOtpApi(phone, purpose);
      if (res.success) return true;
      setError(res.message ?? 'Failed to send OTP');
      if (res.data?.otpSendCount !== undefined) {
        setSendCount(res.data.otpSendCount);
      }
      return false;
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Failed to send OTP');
      setError(message);
      const errObj = err as { data?: { otpSendCount?: number } };
      if (errObj?.data?.otpSendCount !== undefined) {
        setSendCount(errObj.data.otpSendCount);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(
    async (phone: string, code: string, purpose: OtpPurpose): Promise<{ user: unknown; token: string } | null> => {
      setLoading(true);
      setError(null);
      try {
        if (purpose === OTP_PURPOSE.LINK_PHONE) {
          const linked = await verifyLinkPhoneOtp(phone, code);
          if (linked.success && linked.data?.user) {
            // The refreshed session cookie is httpOnly; there is no token to
            // hand back, and callers of this branch do not use one.
            return { user: linked.data.user, token: '' };
          }
          setError(linked.message ?? 'Verification failed');
          return null;
        }

        const res = await verifyOtpApi(phone, code, purpose);
        if (res.success && res.data?.user && res.data?.token) {
          return {
            user: res.data.user,
            token: res.data.token,
          };
        }
        setError(res.message ?? 'Verification failed');
        return null;
      } catch (err: unknown) {
        const message = getApiErrorMessage(err, 'Invalid or expired code');
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    sendOtp,
    verifyOtp,
    loading,
    error,
    sendCount,
    clearError,
  };
}
