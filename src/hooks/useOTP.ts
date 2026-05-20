'use client';

import { useState, useCallback } from 'react';
import { sendOtp as sendOtpApi, verifyOtp as verifyOtpApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/utils/apiError.util';
import type { OtpPurpose } from '@/types/auth.types';

interface UseOTPReturn {
  sendOtp: (email: string, purpose: OtpPurpose) => Promise<boolean>;
  verifyOtp: (email: string, code: string, purpose: OtpPurpose) => Promise<{ user: unknown; token: string } | null>;
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

  const sendOtp = useCallback(async (email: string, purpose: OtpPurpose): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSendCount(null);
    try {
      const res = await sendOtpApi(email, purpose);
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
    async (email: string, code: string, purpose: OtpPurpose): Promise<{ user: unknown; token: string } | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await verifyOtpApi(email, code, purpose);
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
