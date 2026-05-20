import React, { InputHTMLAttributes, ReactNode } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  labelIcon?: ReactNode;
  containerClassName?: string;
  variant?: 'dark' | 'light';
  compact?: boolean;
  showRequiredIndicator?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  labelIcon,
  containerClassName,
  className,
  variant = 'dark',
  compact = false,
  showRequiredIndicator = false,
  ...props
}) => {
  return (
    <div
      className={`${styles.inputContainer} ${variant === 'light' ? styles.lightContainer : ''} ${
        compact ? styles.compactContainer : ''
      } ${containerClassName || ''}`}
    >
      <label className={styles.label}>
        {labelIcon && <span className={styles.labelIcon}>{labelIcon}</span>}
        {label}
        {showRequiredIndicator && (
          <span
            className={styles.requiredStar}
            style={{ color: 'var(--color-error)', marginLeft: '4px', fontWeight: 'bold' }}
          >
            *
          </span>
        )}
      </label>
      <input
        className={`${styles.input} ${variant === 'light' ? styles.lightInput : ''} ${
          error ? styles.inputError : ''
        } ${compact ? styles.compactInput : ''} ${className || ''}`}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default Input;
