'use client';

import { useCallback, useState, type ReactNode } from 'react';

import { useSidebar } from '@/context/SidebarContext';
import { useIsNarrowViewport } from '@/hooks/useIsNarrowViewport';

import { TherapistSidebar } from '../TherapistSidebar';
import { TherapistTopBar } from '../TherapistTopBar';
import { TherapistBottomNav } from '../TherapistBottomNav';
import styles from './styles.module.css';

interface TherapistShellProps {
  children: ReactNode;
}

/**
 * Chrome for the whole therapist area.
 *
 * Built on CSS Grid + `position: sticky`, deliberately NOT the shared Sidebar's
 * `position: fixed` + a global `.main-content { margin-left }` rule toggled by
 * body classes from a `useEffect`. That arrangement is what makes the current
 * therapist pages render broken: the sidebar is loaded with `ssr: false` while
 * the offset is applied immediately, so the content sits 240px to the right of
 * nothing until the chunk arrives — and the sidebar's
 * `backdrop-filter` + `background-attachment: fixed` + animated `width` stack
 * degrades badly wherever compositing falls back to software.
 *
 * Here the two columns are cells of one grid: they cannot desynchronise, there
 * is no global side channel, and there is nothing to hydrate before the layout
 * is correct.
 */
export function TherapistShell({ children }: TherapistShellProps) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { isCollapsed } = useSidebar();
  // NOT SidebarContext's `isDesktop`: that uses a 770px threshold and starts
  // false until a resize effect runs, so the shell rendered full-width and then
  // snapped to the rail after hydration. This matches the CSS breakpoint and is
  // correct on the very first paint.
  const isNarrow = useIsNarrowViewport();
  const collapsed = !isNarrow && isCollapsed;

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);

  return (
    <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ''}`}>
      <TherapistSidebar
        isDrawerOpen={isDrawerOpen}
        onCloseDrawer={closeDrawer}
        collapsed={collapsed}
        isNarrow={isNarrow}
      />

      {/* Scrim only exists while the mobile drawer is open. */}
      {isDrawerOpen && <button type="button" className={styles.scrim} aria-label="Close menu" onClick={closeDrawer} />}

      {/*
       * The topbar must live inside a full-height column, not its own grid row.
       * A sticky item is bound by its GRID AREA — in a `'nav top' / 'nav main'`
       * layout the top area is exactly the topbar's height, so sticky travel was
       * 0px and it scrolled away like a static header.
       */}
      <div className={styles.content}>
        <TherapistTopBar onOpenDrawer={openDrawer} isDrawerOpen={isDrawerOpen} />
        <main className={styles.main}>{children}</main>
      </div>

      <TherapistBottomNav />
    </div>
  );
}

export default TherapistShell;
