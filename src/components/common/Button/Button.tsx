import React, { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function resolveClassName(variant: ButtonVariant, size: ButtonSize, fullWidth: boolean, extra?: string): string {
  return [styles.button, styles[variant], styles[size], fullWidth ? styles.fullWidth : styles.inline, extra ?? '']
    .filter(Boolean)
    .join(' ');
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
  loading = false,
  children,
  className,
  ...props
}) => {
  const resolved = resolveClassName(variant, size, fullWidth, className);
  const content = loading ? <span className={styles.loader} aria-hidden /> : children;

  if ('href' in props && props.href !== undefined) {
    const { href, ...anchorProps } = props;
    return (
      <Link href={href} className={resolved} {...anchorProps}>
        {content}
      </Link>
    );
  }

  const { disabled, ...buttonProps } = props as ButtonAsButton;
  return (
    <button className={resolved} disabled={disabled || loading} {...buttonProps}>
      {content}
    </button>
  );
};

export default Button;
