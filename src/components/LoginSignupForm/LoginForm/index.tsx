import React from 'react';
import { Icon } from '@iconify/react';
import { ICON_EYE, ICON_EYE_CLOSED, ICON_LOADING } from '@/constants/icons';
import styles from './styles.module.css';

import { AuthFormErrors } from '@/hooks/useAuthForm';

export interface LoginFormProps {
  email: string;
  password: string;
  showPassword?: boolean;
  onTogglePassword: () => void;
  fieldErrors: AuthFormErrors;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (field: 'name' | 'email' | 'password', value: string) => void;
  onSignupClick: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  password,
  showPassword = false,
  onTogglePassword,
  fieldErrors,
  loading,
  error,
  onSubmit,
  onInputChange,
  onSignupClick,
}) => {
  return (
    <>
      <h1 className={styles.title}>Log In</h1>
      <p className={styles.divider}>or use your account</p>
      {error && (
        <div role="alert" className={styles.errorBanner} aria-live="polite">
          {error}
        </div>
      )}
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.inputGroup}>
          <input
            type="email"
            placeholder="Email"
            className={[styles.input, fieldErrors.email ? styles.inputError : ''].filter(Boolean).join(' ')}
            value={email}
            onChange={(e) => onInputChange('email', e.target.value)}
            autoComplete="email"
            aria-label="Email address"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          />
          {fieldErrors.email && (
            <span id="login-email-error" className={styles.fieldError}>
              {fieldErrors.email}
            </span>
          )}
        </div>
        <div className={styles.inputGroup}>
          <div className={styles.passwordInputWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className={[styles.input, styles.passwordInput, fieldErrors.password ? styles.inputError : '']
                .filter(Boolean)
                .join(' ')}
              value={password}
              onChange={(e) => onInputChange('password', e.target.value)}
              autoComplete="current-password"
              aria-label="Password"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
            />
            <button
              type="button"
              className={styles.togglePasswordButton}
              onClick={onTogglePassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon icon={showPassword ? ICON_EYE_CLOSED : ICON_EYE} width={20} height={20} />
            </button>
          </div>
          {fieldErrors.password && (
            <span id="login-password-error" className={styles.fieldError}>
              {fieldErrors.password}
            </span>
          )}
        </div>
        <button type="button" onClick={(e) => e.preventDefault()} className={styles.forgotPassword}>
          Forgot your password?
        </button>
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? (
            <div className={styles.loaderWrapper}>
              <Icon icon={ICON_LOADING} width={20} height={20} />
              <span>Logging in</span>
            </div>
          ) : (
            'Log in'
          )}
        </button>
      </form>
      <div className={styles.authToggle}>
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSignupClick} className={styles.authToggleLink}>
          Sign Up
        </button>
      </div>
    </>
  );
};
