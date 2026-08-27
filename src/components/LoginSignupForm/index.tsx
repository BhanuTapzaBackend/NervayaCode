'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
import { useTimeOfDay, type TimeOfDay } from '@/hooks/useTimeOfDay';
import { OTPVerificationStep } from './OTPVerificationStep';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { GoogleButton } from './GoogleButton';
import styles from './styles.module.css';
import { IMAGES } from '@/utils/imageConstants';
import { useZohoLead } from '@/hooks/useZohoLead';
import { AUTH_FLOW_STORAGE_KEYS } from '@/utils/cookieConstants';

export interface LoginSignupFormProps {
  initialMode?: AuthFormMode;
  returnUrl?: string;
  /** Message from a failed redirect-based sign-in (e.g. Google), shown on arrival. */
  initialError?: string;
}

interface HeroImage {
  image: string;
  imageMobile: string;
}

const HERO_IMAGE: Record<TimeOfDay, HeroImage> = {
  morning: {
    image: IMAGES.AUTH_HERO_MORNING,
    imageMobile: IMAGES.AUTH_HERO_MORNING_MOBILE,
  },
  night: {
    image: IMAGES.AUTH_HERO_NIGHT,
    imageMobile: IMAGES.AUTH_HERO_NIGHT_MOBILE,
  },
};

const LoginSignupForm: React.FC<LoginSignupFormProps> = ({
  initialMode = AUTH_FORM_MODE.LOGIN,
  returnUrl,
  initialError,
}) => {
  const { completeLoginWithOtp, clearError: clearAuthError } = useAuthContext();
  const [authStep, setAuthStep] = useState<AuthStep>(AUTH_STEP.CREDENTIALS);
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>(OTP_PURPOSE.LOGIN);
  const { pushLead } = useZohoLead();
  const timeOfDay = useTimeOfDay();
  const hero = HERO_IMAGE[timeOfDay];

  // Restore state from sessionStorage on mount
  useEffect(() => {
    const savedStep = sessionStorage.getItem(AUTH_FLOW_STORAGE_KEYS.STEP);
    if (savedStep) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthStep(savedStep as AuthStep);
    }

    const savedPurpose = sessionStorage.getItem(AUTH_FLOW_STORAGE_KEYS.PURPOSE);
    if (savedPurpose) {
      setOtpPurpose(savedPurpose as OtpPurpose);
    }
  }, []);

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(AUTH_FLOW_STORAGE_KEYS.STEP, authStep);
    sessionStorage.setItem(AUTH_FLOW_STORAGE_KEYS.PURPOSE, otpPurpose);
  }, [authStep, otpPurpose]);

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

  // A redirect-flow failure (Google) has no live form state behind it, so it is
  // surfaced through the same banner until a real submission replaces it.
  const shownError = error || (authStep === AUTH_STEP.CREDENTIALS ? (initialError ?? null) : null);

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

          // The backend already sent the initial login OTP. Start the resend
          // cooldown so OTPVerificationStep doesn't auto-send a duplicate.
          sessionStorage.setItem(AUTH_FLOW_STORAGE_KEYS.OTP_EXPIRES_AT, String(Date.now() + 600 * 1000));
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

          // The backend automatically sends the initial OTP for signup.
          // Start the 10-minute cooldown timer now so the resend button isn't immediately clickable.
          sessionStorage.setItem(AUTH_FLOW_STORAGE_KEYS.OTP_EXPIRES_AT, String(Date.now() + 600 * 1000));

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

  return (
    <div className={styles.page}>
      <div className={styles.backgroundLayer}>
        <Image
          key={hero.image}
          src={hero.image}
          alt=""
          fill
          sizes="100vw"
          className={styles.backgroundImage}
          priority
        />
        <Image
          key={hero.imageMobile}
          src={hero.imageMobile}
          alt=""
          fill
          sizes="100vw"
          className={styles.backgroundImageMobile}
        />
      </div>

      <div className={styles.contentLayer}>
        <main className={styles.formPanelWrap}>
          <div className={styles.formPanel}>
            <Link href="/" className={styles.formLogo} style={{ textDecoration: 'none' }}>
              <span className={styles.brandWord}>
                Ner<span className={styles.brandAccent}>vaya</span>
              </span>
              <span className={styles.brandTm}>™</span>
            </Link>
            {authStep === AUTH_STEP.OTP ? (
              <OTPVerificationStep
                phone={phone.trim()}
                purpose={otpPurpose}
                onSuccess={onOtpSuccess}
                onBack={onOtpBack}
                // Both login and signup backends send the initial OTP on submit,
                // so the verification step must never auto-send (avoids a duplicate OTP).
                autoSend={false}
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
                      ? 'Take the first step towards a happier you.'
                      : 'Enter your WhatsApp number and we’ll send you a code.'}
                  </p>
                </div>

                <GoogleButton returnUrl={returnUrl} disabled={loading} />

                <div className={styles.divider} role="separator">
                  <span className={styles.dividerText}>or</span>
                </div>

                <div className={styles.formWrap} key={isSignup ? 'signup' : 'login'}>
                  {isSignup ? (
                    <SignupForm
                      name={name}
                      phone={phone}
                      fieldErrors={fieldErrors}
                      loading={loading}
                      error={shownError}
                      onSubmit={onSignupSubmit}
                      onInputChange={handleInputChange}
                    />
                  ) : (
                    <LoginForm
                      phone={phone}
                      fieldErrors={fieldErrors}
                      loading={loading}
                      error={shownError}
                      onSubmit={onLoginSubmit}
                      onInputChange={handleInputChange}
                    />
                  )}
                </div>

                <p className={styles.footerLink}>
                  {isSignup ? 'Already have an account? ' : 'New here? '}
                  <button type="button" className={styles.footerLinkBtn} onClick={() => switchMode(!isSignup)}>
                    {isSignup ? 'Log in' : 'Sign up'}
                  </button>
                </p>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginSignupForm;
