import React from 'react';
import { Icon } from '@iconify/react';
import { ICON_LOADING, ICON_WHATSAPP } from '@/constants/icons';
import { AuthField } from '../AuthField';
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
        <AuthField
          id="login-phone"
          type="tel"
          inputMode="tel"
          icon={ICON_WHATSAPP}
          placeholder="+91 WhatsApp number"
          label="WhatsApp number"
          value={phone}
          error={fieldErrors.phone}
          autoComplete="tel"
          onChange={(value) => onInputChange('phone', value)}
        />
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
