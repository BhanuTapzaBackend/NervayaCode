'use client';

import { Icon } from '@iconify/react';

import { ICON_CLOCK } from '@/constants/icons';
import styles from './styles.module.css';

/**
 * Placeholder for a nav destination that has no data model behind it yet.
 *
 * Preferable to either a broken link or a disabled nav item: the therapist can
 * see the section exists and that it is not ready, rather than clicking
 * something that silently does nothing.
 */
export function ComingSoonPanel({ title, description }: { title: string; description: string }) {
  return (
    <section className={styles.panel}>
      <Icon icon={ICON_CLOCK} width={28} height={28} className={styles.icon} aria-hidden="true" />
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </section>
  );
}

export default ComingSoonPanel;
