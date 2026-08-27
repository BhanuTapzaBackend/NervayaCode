'use client';

import { Icon } from '@iconify/react';

import { ICON_CALENDAR, ICON_CHECK, ICON_CLOCK } from '@/constants/icons';
import styles from './styles.module.css';

interface StatCardsProps {
  counts?: { upcomingToday: number; completedToday: number; pending: number; cancelledToday: number };
}

/**
 * Three cards, not the mockup's four.
 *
 * The fourth is "This Week Earnings" — cut deliberately: therapists do not see
 * financial data, and nothing in this codebase computes per-therapist revenue.
 */
const CARDS = [
  {
    key: 'upcomingToday',
    label: 'Upcoming sessions',
    caption: 'Today',
    icon: ICON_CALENDAR,
    tone: styles.iconViolet,
  },
  {
    key: 'completedToday',
    label: 'Completed sessions',
    caption: 'Today',
    icon: ICON_CHECK,
    tone: styles.iconEmerald,
  },
  {
    key: 'pending',
    label: 'Pending requests',
    caption: 'Needs action',
    icon: ICON_CLOCK,
    tone: styles.iconAmber,
  },
] as const;

export function StatCards({ counts }: StatCardsProps) {
  return (
    <div className={styles.row}>
      {CARDS.map((card) => (
        <article key={card.key} className={styles.card}>
          <div className={styles.text}>
            <p className={styles.label}>{card.label}</p>
            <p className={styles.value}>{counts?.[card.key] ?? 0}</p>
            <p className={styles.caption}>{card.caption}</p>
          </div>
          <span className={`${styles.iconChip} ${card.tone}`} aria-hidden="true">
            <Icon icon={card.icon} width={20} height={20} />
          </span>
        </article>
      ))}
    </div>
  );
}

export default StatCards;
