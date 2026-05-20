'use client';

import { useFloatingActions } from '@/context/FloatingActionsContext';
import styles from './styles.module.css';

export function FloatingActionsTrigger() {
  const { isExpanded, hasButtons, expand } = useFloatingActions();

  if (!hasButtons || isExpanded) return null;

  return (
    <button type="button" className={styles.trigger} onClick={expand} aria-label="Show floating actions">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}
