'use client';

import { Icon } from '@iconify/react';

import { ICON_GOOGLE } from '@/constants/icons';
import styles from './styles.module.css';

interface GoogleButtonProps {
  /** Where to send the user after a successful sign-in. */
  returnUrl?: string;
  disabled?: boolean;
}

/**
 * Starts the Google OAuth redirect flow.
 *
 * Deliberately a plain `<a>`, not a fetch: an OAuth authorize request has to be
 * a top-level browser navigation. Firing it through axios would return Google's
 * consent HTML into a promise and leave the user sitting on the login page.
 *
 * The copy stays neutral ("Continue with...") because this one component renders
 * in both the login and signup modes of the shared shell.
 */
export function GoogleButton({ returnUrl, disabled = false }: GoogleButtonProps) {
  const href = returnUrl
    ? `/api/auth/google/start?returnUrl=${encodeURIComponent(returnUrl)}`
    : '/api/auth/google/start';

  return (
    <a
      href={disabled ? undefined : href}
      className={styles.button}
      aria-disabled={disabled}
      // The whole label already reads "Continue with Google"; the mark is decorative.
      role="button"
    >
      <Icon icon={ICON_GOOGLE} className={styles.icon} aria-hidden="true" />
      <span>Continue with Google</span>
    </a>
  );
}

export default GoogleButton;
