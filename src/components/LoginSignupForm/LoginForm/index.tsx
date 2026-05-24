import React from 'react';
import { Icon } from '@iconify/react';
import { ICON_LOADING } from '@/constants/icons';
import styles from './styles.module.css';

import { AuthFormErrors } from '@/hooks/useAuthForm';

export interface LoginFormProps {
  phone: string;
  fieldErrors: AuthFormErrors;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (field: 'name' | 'phone', value: string) => void;
  onSignupClick: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  phone,
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
      <p className={styles.divider}>we&apos;ll send a code to your WhatsApp</p>
      {error && (
        <div role="alert" className={styles.errorBanner} aria-live="polite">
          {error}
        </div>
      )}
      <form className={styles.form} onSubmit={onSubmit}>
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
            aria-describedby={fieldErrors.phone ? 'login-phone-error' : undefined}
          />
          {fieldErrors.phone && (
            <span id="login-phone-error" className={styles.fieldError}>
              {fieldErrors.phone}
            </span>
          )}
        </div>
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? (
            <div className={styles.loaderWrapper}>
              <Icon icon={ICON_LOADING} width={20} height={20} />
              <span>Sending code</span>
            </div>
          ) : (
            'Send code'
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
