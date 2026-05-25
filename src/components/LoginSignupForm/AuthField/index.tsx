import React from 'react';
import { Icon } from '@iconify/react';
import styles from './styles.module.css';

export interface AuthFieldProps {
  id: string;
  type: React.HTMLInputTypeAttribute;
  value: string;
  placeholder: string;
  icon: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
  /** Static trailing adornment, e.g. the "+91" on the WhatsApp field. */
  suffix?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}

/**
 * Themed text field with a leading icon and optional trailing suffix.
 * Colors come from the --auth-* CSS variables set on the auth page, so it
 * flips automatically between the light (morning) and dark (night) themes.
 */
export const AuthField: React.FC<AuthFieldProps> = ({
  id,
  type,
  value,
  placeholder,
  icon,
  onChange,
  label,
  error,
  suffix,
  autoComplete,
  inputMode,
}) => {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={styles.field}>
      <div className={`${styles.control} ${error ? styles.controlError : ''}`}>
        <Icon icon={icon} className={styles.leadingIcon} aria-hidden="true" width={20} height={20} />
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          className={styles.input}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={errorId}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {error && (
        <span id={errorId} className={styles.fieldError}>
          {error}
        </span>
      )}
    </div>
  );
};
