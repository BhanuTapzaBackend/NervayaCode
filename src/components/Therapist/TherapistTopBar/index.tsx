'use client';

import { Icon } from '@iconify/react';

import { useAuth } from '@/hooks/useAuth';
import { ICON_MENU, ICON_LOGOUT } from '@/constants/icons';
import styles from './styles.module.css';

interface TherapistTopBarProps {
  onOpenDrawer: () => void;
  isDrawerOpen: boolean;
}

/**
 * Welcome line plus the account control.
 *
 * The mockup also shows a notification bell with an unread count and a chat
 * icon. Neither is here: this codebase has no notification model and no
 * messaging model, so both would be permanently-zero decoration at best and a
 * hardcoded lie at worst.
 */
export function TherapistTopBar({ onOpenDrawer, isDrawerOpen }: TherapistTopBarProps) {
  const { user, logout } = useAuth();

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? 'there';
  const initials = (user?.name?.trim() ?? '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={onOpenDrawer}
        aria-label="Open menu"
        aria-expanded={isDrawerOpen}
        aria-controls="therapist-nav"
      >
        <Icon icon={ICON_MENU} width={22} height={22} />
      </button>

      <div className={styles.greeting}>
        <h1 className={styles.title}>Welcome back, {firstName}</h1>
        <p className={styles.subtitle}>Here&apos;s what&apos;s happening with your sessions today.</p>
      </div>

      <div className={styles.account}>
        <span className={styles.avatar} aria-hidden="true">
          {initials || 'T'}
        </span>
        <span className={styles.identity}>
          <span className={styles.name}>{user?.name ?? 'Therapist'}</span>
          <span className={styles.role}>Therapist</span>
        </span>
        <button type="button" className={styles.logoutBtn} onClick={() => void logout()} aria-label="Log out">
          <Icon icon={ICON_LOGOUT} width={18} height={18} />
        </button>
      </div>
    </header>
  );
}

export default TherapistTopBar;
