'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';

import { THERAPIST_NAV } from '@/utils/therapistNavConstants';
import { useRef } from 'react';

import { useTherapistDashboard } from '@/context/TherapistDashboardContext';
import { useSidebar } from '@/context/SidebarContext';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from '@/constants/icons';
import styles from './styles.module.css';

interface TherapistSidebarProps {
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  /** Rail mode. Owned by the shell so both stay in lockstep. */
  collapsed: boolean;
  /** True below the shell's mobile breakpoint, where this becomes a drawer. */
  isNarrow: boolean;
}

const SUMMARY_ROWS = [
  { key: 'upcomingToday', label: 'Upcoming', tone: styles.dotUpcoming },
  { key: 'completedToday', label: 'Completed', tone: styles.dotCompleted },
  { key: 'pending', label: 'Pending', tone: styles.dotPending },
  { key: 'cancelledToday', label: 'Cancelled', tone: styles.dotCancelled },
] as const;

export function TherapistSidebar({ isDrawerOpen, onCloseDrawer, collapsed, isNarrow }: TherapistSidebarProps) {
  const pathname = usePathname();
  const { data } = useTherapistDashboard();
  // Same context the customer sidebar uses, so the collapsed preference is one
  // setting across the whole app rather than a therapist-only duplicate.
  const { isCollapsed, toggleCollapsed } = useSidebar();

  const asideRef = useRef<HTMLElement>(null);
  // Escape and outside-click, matching every other dismissible surface here.
  useModalDismiss(isNarrow && isDrawerOpen, asideRef, onCloseDrawer);

  return (
    <aside
      ref={asideRef}
      id="therapist-nav"
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${isDrawerOpen ? styles.sidebarOpen : ''}`}
      // A drawer that is merely translated off-screen is still in the tab order
      // and still read aloud. `inert` takes it out of both while closed.
      inert={isNarrow && !isDrawerOpen}
    >
      <div className={styles.head}>
        <Link href="/therapist/dashboard" className={styles.brand} onClick={onCloseDrawer}>
          <Image
            src="/icons/nervaya-logo.jpg"
            alt="Nervaya"
            width={540}
            height={180}
            className={styles.logo}
            priority
          />
        </Link>

        {!isNarrow && (
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={isCollapsed}
          >
            <Icon icon={isCollapsed ? ICON_CHEVRON_RIGHT : ICON_CHEVRON_LEFT} width={16} height={16} />
          </button>
        )}
      </div>

      <nav className={styles.nav} aria-label="Therapist">
        {THERAPIST_NAV.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onCloseDrawer}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
            >
              <Icon icon={item.icon} className={styles.navIcon} aria-hidden="true" />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.summary}>
        <h2 className={styles.summaryTitle}>Today&apos;s summary</h2>
        {SUMMARY_ROWS.map((row) => (
          <div key={row.key} className={styles.summaryRow}>
            <span className={`${styles.dot} ${row.tone}`} aria-hidden="true" />
            <span className={styles.summaryCount}>{data?.counts[row.key] ?? 0}</span>
            <span className={styles.summaryLabel}>{row.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default TherapistSidebar;
