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
}

export const LoginForm: React.FC<LoginFormProps> = ({
  phone,
  fieldErrors,
  loading,
  error,
  onSubmit,
  onInputChange,
}) => {
  return (
    <>
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
            placeholder="WhatsApp number"
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
    </>
  );
};
