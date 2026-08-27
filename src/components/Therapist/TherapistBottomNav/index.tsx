'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';

import { THERAPIST_MOBILE_NAV } from '@/utils/therapistNavConstants';
import styles from './styles.module.css';

/**
 * Mobile tab bar.
 *
 * Therapists previously had NO navigation at all below 770px: the shared
 * sidebar refuses to render, and BottomNavigation returns null for
 * professional roles. This closes that hole.
 */
export function TherapistBottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav} aria-label="Therapist sections">
      {THERAPIST_MOBILE_NAV.map((item) => {
        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon icon={item.icon} className={styles.icon} aria-hidden="true" />
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default TherapistBottomNav;
