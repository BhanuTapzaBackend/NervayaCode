import React from 'react';
import { Icon } from '@iconify/react';
import { ICON_EYE, ICON_EYE_CLOSED, ICON_LOADING } from '@/constants/icons';
import styles from './styles.module.css';

import { AuthFormErrors } from '@/hooks/useAuthForm';

export interface SignupFormProps {
  name: string;
  email: string;
  password: string;
  showPassword?: boolean;
  onTogglePassword: () => void;
  fieldErrors: AuthFormErrors;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (field: 'name' | 'email' | 'password', value: string) => void;
  onLoginClick: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  name,
  email,
  password,
  showPassword = false,
  onTogglePassword,
  fieldErrors,
  loading,
  error,
  onSubmit,
  onInputChange,
  onLoginClick,
}) => {
  return (
    <>
      <h1 className={styles.title}>Create Account</h1>
      <p className={styles.divider}>or use your email for registration</p>
      {error && (
        <div role="alert" className={styles.errorBanner} aria-live="polite">
          {error}
        </div>
      )}
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Name"
            className={[styles.input, fieldErrors.name ? styles.inputError : ''].filter(Boolean).join(' ')}
            value={name}
            onChange={(e) => onInputChange('name', e.target.value)}
            autoComplete="name"
            aria-label="Full name"
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
          />
          {fieldErrors.name && (
            <span id="name-error" className={styles.fieldError}>
              {fieldErrors.name}
            </span>
          )}
        </div>
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
            aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
          />
          {fieldErrors.email && (
            <span id="signup-email-error" className={styles.fieldError}>
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
              autoComplete="new-password"
              aria-label="Password"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'signup-password-error' : undefined}
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
            <span id="signup-password-error" className={styles.fieldError}>
              {fieldErrors.password}
            </span>
          )}
        </div>
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? (
            <div className={styles.loaderWrapper}>
              <Icon icon={ICON_LOADING} width={20} height={20} />
              <span>Signing up</span>
            </div>
          ) : (
            'Sign up'
          )}
        </button>
      </form>
      <div className={styles.authToggle}>
        Already have an account?{' '}
        <button type="button" onClick={onLoginClick} className={styles.authToggleLink}>
          Log In
        </button>
      </div>
    </>
  );
};
