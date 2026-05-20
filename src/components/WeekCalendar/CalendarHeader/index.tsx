'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import styles from './styles.module.css';

interface CalendarHeaderProps {
  headerLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  therapistName?: string;
  onBack?: () => void;
  viewMode: 'day' | 'week';
  onViewModeChange: (mode: 'day' | 'week') => void;
}

const LEGEND = [
  { color: 'var(--color-success)', label: 'Available' },
  { color: 'var(--color-warning)', label: 'Pending' },
  { color: 'var(--color-accent)', label: 'Confirmed' },
  { color: 'var(--color-text-tertiary)', label: 'Completed' },
  { color: 'var(--color-error)', label: 'Blocked' },
];

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  headerLabel,
  onPrev,
  onNext,
  onToday,
  onToggleSidebar,
  onBack,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className={styles.header}>
      {/* Left: nav + title */}
      <div className={styles.leftGroup}>
        {onBack && (
          <button type="button" className={styles.backBtn} onClick={onBack}>
            <Icon icon="solar:alt-arrow-left-linear" width={16} height={16} />
          </button>
        )}
        {onToggleSidebar && (
          <button type="button" className={styles.iconBtn} onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <Icon icon="solar:hamburger-menu-linear" width={18} height={18} />
          </button>
        )}
        <div className={styles.navArrows}>
          <button type="button" className={styles.arrowBtn} onClick={onPrev} aria-label="Previous">
            <Icon icon="solar:alt-arrow-left-linear" width={18} height={18} />
          </button>
          <button type="button" className={styles.arrowBtn} onClick={onNext} aria-label="Next">
            <Icon icon="solar:alt-arrow-right-linear" width={18} height={18} />
          </button>
        </div>
        <h2 className={styles.title}>{headerLabel}</h2>
      </div>

      {/* Right: legend + today + view toggle */}
      <div className={styles.rightGroup}>
        <div className={styles.legend}>
          {LEGEND.map((item) => (
            <span key={item.label} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
        <div className={styles.divider} />
        <div className={styles.viewToggleGroup}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === 'day' ? styles.toggleBtnActive : ''}`}
            onClick={() => onViewModeChange('day')}
          >
            Day
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === 'week' ? styles.toggleBtnActive : ''}`}
            onClick={() => onViewModeChange('week')}
          >
            Week
          </button>
        </div>
        <button type="button" className={styles.todayBtn} onClick={onToday}>
          Today
        </button>
      </div>
    </div>
  );
};
