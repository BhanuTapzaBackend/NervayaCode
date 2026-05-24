'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import {
  AUTH_FORM_MODE,
  AUTH_STEP,
  OTP_PURPOSE,
  type AuthFormMode,
  type AuthStep,
  type OtpPurpose,
} from '@/lib/constants/enums';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useAuthContext, type AuthData } from '@/context/AuthContext';
import { OTPVerificationStep } from './OTPVerificationStep';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import styles from './styles.module.css';
import { IMAGES } from '@/utils/imageConstants';
import { useZohoLead } from '@/hooks/useZohoLead';

export interface LoginSignupFormProps {
  initialMode?: AuthFormMode;
  returnUrl?: string;
}

const LoginSignupForm: React.FC<LoginSignupFormProps> = ({ initialMode = AUTH_FORM_MODE.LOGIN, returnUrl }) => {
  const { completeLoginWithOtp, clearError: clearAuthError } = useAuthContext();
  const [authStep, setAuthStep] = useState<AuthStep>(AUTH_STEP.CREDENTIALS);
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>(OTP_PURPOSE.LOGIN);
  const { pushLead } = useZohoLead();

  const {
    isRightPanelActive,
    phone,
    name,
    fieldErrors,
    loading,
    error,
    handleSignupClick,
    handleLoginClick,
    handleLoginSubmit,
    handleSignupSubmit,
    handleInputChange,
  } = useAuthForm({ initialMode, returnUrl });

  const isSignup = isRightPanelActive;

  const onLoginSubmit = useCallback(
    async (e: React.FormEvent) => {
      try {
        const response = await handleLoginSubmit(e);
        if (
          response?.success &&
          response?.data &&
          typeof response.data === 'object' &&
          'requireOtp' in response.data &&
          response.data.requireOtp &&
          'phone' in response.data
        ) {
          clearAuthError();
          setOtpPurpose(OTP_PURPOSE.LOGIN);
          setAuthStep(AUTH_STEP.OTP);
        }
      } catch {
        /* error surfaced via AuthContext + error prop */
      }
    },
    [handleLoginSubmit, clearAuthError],
  );

  const onSignupSubmit = useCallback(
    async (e: React.FormEvent) => {
      try {
        const response = await handleSignupSubmit(e);
        if (
          response?.success &&
          response?.data &&
          typeof response.data === 'object' &&
          'requireOtp' in response.data &&
          response.data.requireOtp &&
          'phone' in response.data
        ) {
          clearAuthError();
          setOtpPurpose(OTP_PURPOSE.SIGNUP);
          setAuthStep(AUTH_STEP.OTP);

          // Capture the lead even if they abandon at the OTP step.
          pushLead({
            name,
            phone,
            source: 'Nervaya Signup',
            message: 'User initiated signup and is at the OTP verification step.',
          });
        }
      } catch {
        /* error surfaced via AuthContext + error prop */
      }
    },
    [handleSignupSubmit, clearAuthError, name, phone, pushLead],
  );

  const onOtpSuccess = useCallback(
    (session?: { user: unknown; token: string }) => {
      if (session?.user && session?.token) {
        completeLoginWithOtp(
          { user: session.user as AuthData['user'], token: session.token },
          otpPurpose === OTP_PURPOSE.SIGNUP,
          returnUrl,
        );
      }
    },
    [completeLoginWithOtp, returnUrl, otpPurpose],
  );

  const onOtpBack = useCallback(() => setAuthStep(AUTH_STEP.CREDENTIALS), []);

  const switchMode = useCallback(
    (toSignup: boolean) => {
      setAuthStep(AUTH_STEP.CREDENTIALS);
      if (toSignup) {
        handleSignupClick();
      } else {
        handleLoginClick();
      }
    },
    [handleSignupClick, handleLoginClick],
  );

  const illustration = isSignup ? IMAGES.AUTH_SIGNUP_ILLUSTRATION : IMAGES.AUTH_LOGIN_ILLUSTRATION;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <aside className={styles.illustrationPanel}>
          <Image
            key={illustration}
            src={illustration}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className={styles.illustration}
            priority
          />
        </aside>

        <main className={styles.formPanel}>
          {authStep === AUTH_STEP.OTP ? (
            <OTPVerificationStep
              phone={phone.trim()}
              purpose={otpPurpose}
              onSuccess={onOtpSuccess}
              onBack={onOtpBack}
              autoSend={otpPurpose !== OTP_PURPOSE.SIGNUP}
            />
          ) : (
            <>
              <div className={styles.toggle} role="tablist" aria-label="Choose log in or sign up">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isSignup}
                  className={`${styles.toggleBtn} ${!isSignup ? styles.toggleActive : ''}`}
                  onClick={() => switchMode(false)}
                >
                  Log in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSignup}
                  className={`${styles.toggleBtn} ${isSignup ? styles.toggleActive : ''}`}
                  onClick={() => switchMode(true)}
                >
                  Sign up
                </button>
              </div>

              <div className={styles.intro}>
                <h1 className={styles.heading}>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
                <p className={styles.subheading}>
                  {isSignup
                    ? 'Tell us your name and WhatsApp number to get started.'
                    : 'Enter your WhatsApp number and we’ll send you a code.'}
                </p>
              </div>

              <div className={styles.formWrap} key={isSignup ? 'signup' : 'login'}>
                {isSignup ? (
                  <SignupForm
                    name={name}
                    phone={phone}
                    fieldErrors={fieldErrors}
                    loading={loading}
                    error={error}
                    onSubmit={onSignupSubmit}
                    onInputChange={handleInputChange}
                  />
                ) : (
                  <LoginForm
                    phone={phone}
                    fieldErrors={fieldErrors}
                    loading={loading}
                    error={error}
                    onSubmit={onLoginSubmit}
                    onInputChange={handleInputChange}
                  />
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default LoginSignupForm;
