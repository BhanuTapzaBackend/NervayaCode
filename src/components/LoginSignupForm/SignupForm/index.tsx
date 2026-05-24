import React from 'react';
import { Icon } from '@iconify/react';
import { ICON_LOADING } from '@/constants/icons';
import styles from './styles.module.css';

import { AuthFormErrors } from '@/hooks/useAuthForm';

export interface SignupFormProps {
  name: string;
  phone: string;
  fieldErrors: AuthFormErrors;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (field: 'name' | 'phone', value: string) => void;
  onLoginClick: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  name,
  phone,
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
      <p className={styles.divider}>we&apos;ll send a code to your WhatsApp</p>
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
            type="tel"
            inputMode="tel"
            placeholder="WhatsApp number (e.g. +91 98765 43210)"
            className={[styles.input, fieldErrors.phone ? styles.inputError : ''].filter(Boolean).join(' ')}
            value={phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            autoComplete="tel"
            aria-label="WhatsApp number"
            aria-invalid={!!fieldErrors.phone}
            aria-describedby={fieldErrors.phone ? 'signup-phone-error' : undefined}
          />
          {fieldErrors.phone && (
            <span id="signup-phone-error" className={styles.fieldError}>
              {fieldErrors.phone}
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
