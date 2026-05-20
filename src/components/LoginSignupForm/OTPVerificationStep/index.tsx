'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useOTP } from '@/hooks/useOTP';
import type { OtpPurpose } from '@/types/auth.types';
import type { AuthData } from '@/context/AuthContext';
import styles from './styles.module.css';

const RESEND_COOLDOWN_SEC = 60;
const OTP_LENGTH = 6;

export interface OTPVerificationStepProps {
  email: string;
  purpose: OtpPurpose;
  onSuccess: (session?: AuthData) => void;
  onBack?: () => void;
  autoSend?: boolean;
}

export function OTPVerificationStep({ email, purpose, onSuccess, onBack, autoSend = true }: OTPVerificationStepProps) {
  const { sendOtp, verifyOtp, loading, error, sendCount, clearError } = useOTP();
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtpOnce = useCallback(() => {
    clearError();
    sendOtp(email, purpose);
    setCooldown(RESEND_COOLDOWN_SEC);
  }, [email, purpose, sendOtp, clearError]);

  useEffect(() => {
    if (autoSend) {
      const id = setTimeout(() => sendOtpOnce(), 0);
      return () => clearTimeout(id);
    }
  }, [sendOtpOnce, autoSend]);

  useEffect(() => {
    if (error && error.includes('Signup session expired')) {
      if (onBack) onBack();
    }
  }, [error, onBack]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = [...code];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = d;
      });
      setCode(next);
      const focusIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...code];
      next[index - 1] = '';
      setCode(next);
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== OTP_LENGTH) return;
    clearError();
    const session = await verifyOtp(email, fullCode, purpose);
    if (session) {
      onSuccess({
        user: session.user as AuthData['user'],
        token: session.token,
      });
    }
  };

  const fullCode = code.join('');
  const canVerify = fullCode.length === OTP_LENGTH && !loading;

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title} id="otp-title">
        Enter verification code
      </h1>
      <p className={styles.description} id="otp-description">
        We sent a 6-digit code to {email}. Enter it below.
      </p>

      <div className={styles.otpInputGroup} role="group" aria-labelledby="otp-title" aria-describedby="otp-description">
        {[0, 1, 2, 3, 4, 5].map((position) => (
          <input
            key={`otp-${position}`}
            ref={(el) => {
              inputRefs.current[position] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={OTP_LENGTH}
            autoComplete="one-time-code"
            value={code[position]}
            onChange={(e) => handleDigitChange(position, e.target.value)}
            onKeyDown={(e) => handleKeyDown(position, e)}
            className={styles.otpDigit}
            aria-label={`Digit ${position + 1} of ${OTP_LENGTH}`}
            aria-invalid={!!error}
            disabled={loading}
          />
        ))}
      </div>

      {error && (
        <div role="alert" className={styles.errorBanner} aria-live="polite">
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          onClick={handleVerify}
          disabled={!canVerify}
          aria-label="Verify code"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        {onBack && (
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            disabled={loading}
            aria-label="Back to log in"
          >
            Back
          </button>
        )}
      </div>

      <div className={styles.resendRow}>
        <button
          type="button"
          className={styles.resendButton}
          onClick={sendOtpOnce}
          disabled={loading || cooldown > 0}
          aria-label={cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend code'}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
        {sendCount !== null && <span className={styles.sendCount}>OTPs sent this hour: {sendCount}</span>}
      </div>
    </div>
  );
}
