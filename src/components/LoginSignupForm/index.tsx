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
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const { pushLead } = useZohoLead();

  const {
    isRightPanelActive,
    email,
    password,
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
          'email' in response.data
        ) {
          clearAuthError();
          setOtpPurpose(OTP_PURPOSE.LOGIN);
          setAuthStep(AUTH_STEP.OTP);
        }
        // If login succeeds without OTP, handleAuthSuccess in AuthContext handles navigation
      } catch {
        // Error is already set in AuthContext by the login function
        // The error will be displayed via the error prop passed to LoginForm
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
          'email' in response.data
        ) {
          clearAuthError();
          setOtpPurpose(OTP_PURPOSE.SIGNUP);
          setAuthStep(AUTH_STEP.OTP);

          // Push to Zoho CRM — captures the lead even if they abandon here
          pushLead({
            name: name,
            email: email,
            source: 'Nervaya Signup',
            message: 'User initiated signup and is at the OTP verification step.',
          });
        }
        // If signup succeeds without OTP, handleAuthSuccess in AuthContext handles navigation
      } catch {
        // Error is already set in AuthContext by the signup function
        // The error will be displayed via the error prop passed to SignupForm
      }
    },
    [handleSignupSubmit, clearAuthError, email, name, pushLead],
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

  return (
    <div className={styles.container}>
      <div className={`${styles.authCard} ${isRightPanelActive ? styles.rightPanelActive : ''}`}>
        <div
          className={`${styles.formSection} ${styles.formSignup}`}
          style={{
            opacity: isRightPanelActive ? 1 : 0,
            zIndex: isRightPanelActive ? 5 : 1,
            transform: isRightPanelActive ? 'translateX(100%)' : 'translateX(0)',
          }}
        >
          {authStep === AUTH_STEP.OTP && otpPurpose === OTP_PURPOSE.SIGNUP ? (
            <OTPVerificationStep
              email={email.trim().toLowerCase()}
              purpose={OTP_PURPOSE.SIGNUP}
              onSuccess={onOtpSuccess}
              onBack={onOtpBack}
              autoSend={false}
            />
          ) : (
            <SignupForm
              name={name}
              email={email}
              password={password}
              showPassword={showSignupPassword}
              onTogglePassword={() => setShowSignupPassword((prev) => !prev)}
              fieldErrors={fieldErrors}
              loading={loading}
              error={error}
              onSubmit={onSignupSubmit}
              onInputChange={handleInputChange}
              onLoginClick={handleLoginClick}
            />
          )}
        </div>

        <div
          className={`${styles.formSection} ${styles.formLogin}`}
          style={{
            opacity: isRightPanelActive ? 0 : 1,
            zIndex: isRightPanelActive ? 1 : 5,
            transform: isRightPanelActive ? 'translateX(100%)' : 'translateX(0)',
          }}
        >
          {authStep === AUTH_STEP.OTP && otpPurpose === OTP_PURPOSE.LOGIN ? (
            <OTPVerificationStep
              email={email.trim().toLowerCase()}
              purpose={OTP_PURPOSE.LOGIN}
              onSuccess={onOtpSuccess}
              onBack={onOtpBack}
            />
          ) : (
            <LoginForm
              email={email}
              password={password}
              showPassword={showLoginPassword}
              onTogglePassword={() => setShowLoginPassword((prev) => !prev)}
              fieldErrors={fieldErrors}
              loading={loading}
              error={error}
              onSubmit={onLoginSubmit}
              onInputChange={handleInputChange}
              onSignupClick={handleSignupClick}
            />
          )}
        </div>

        <div className={styles.overlayContainer}>
          <div className={styles.overlay}>
            <div className={styles.overlayBg} style={{ left: 0 }}>
              <Image
                src={IMAGES.AUTH_LOGIN_ILLUSTRATION}
                alt="Login Illustration"
                fill
                sizes="50vw"
                className={styles.overlayImage}
                priority
              />
              <div className={styles.overlayDim}></div>
            </div>
            <div className={styles.overlayBg} style={{ right: 0 }}>
              <Image
                src={IMAGES.AUTH_SIGNUP_ILLUSTRATION}
                alt="Signup Illustration"
                fill
                sizes="50vw"
                className={styles.overlayImage}
                priority
              />
              <div className={styles.overlayDim}></div>
            </div>

            <div className={`${styles.overlayPanel} ${styles.overlayLeft}`}>
              <h1 className={`${styles.overlayTitle} ${styles.welcomeBackText}`}>Welcome Back!</h1>
              <p className={styles.overlayText}>To keep connected with us please login with your personal info</p>
              <button type="button" className={styles.ghostButton} onClick={handleLoginClick}>
                OK
              </button>
            </div>
            <div className={`${styles.overlayPanel} ${styles.overlayRight}`}>
              <h1 className={styles.overlayTitle}>Hello, Friend!</h1>
              <p className={styles.overlayText}>Enter your personal details and start your journey with us</p>
              <button type="button" className={styles.ghostButton} onClick={handleSignupClick}>
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignupForm;
