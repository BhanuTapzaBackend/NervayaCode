'use client';

import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { isSameDay, toDateStr } from '../utils/calendarHelpers';
import styles from './styles.module.css';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(new Date(year, month, d));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  return weeks;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({ selectedDate, onDateSelect }) => {
  const [viewYear, setViewYear] = React.useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(selectedDate.getMonth());

  const weeks = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const today = useMemo(() => new Date(), []);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className={styles.miniCal}>
      <div className={styles.header}>
        <button type="button" className={styles.navBtn} onClick={goPrev} aria-label="Previous month">
          <Icon icon="solar:alt-arrow-left-linear" width={16} height={16} />
        </button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button type="button" className={styles.navBtn} onClick={goNext} aria-label="Next month">
          <Icon icon="solar:alt-arrow-right-linear" width={16} height={16} />
        </button>
      </div>

      <div className={styles.dayNames}>
        {['S_sun', 'M_mon', 'T_tue', 'W_wed', 'T_thu', 'F_fri', 'S_sat'].map((dayKey) => (
          <span key={`dayname-${dayKey}`} className={styles.dayNameCell}>
            {dayKey.split('_')[0]}
          </span>
        ))}
        {/* We use unique suffixes to differentiate between identical day letters like 'S' or 'T' */}
      </div>

      <div className={styles.grid}>
        {weeks.map((week, weekIndex) => {
          const firstDay = week.find((d) => d !== null);
          const weekKey = firstDay ? toDateStr(firstDay) : `week-${weekIndex}`;
          return (
            <div key={weekKey} className={styles.weekRow}>
              {week.map((day, dayIdx) => {
                const emptyKey = `empty-${weekKey}-${dayIdx}`;
                if (!day) {
                  return <span key={emptyKey} className={styles.emptyCell} />;
                }
                const isToday = isSameDay(day, today);
                const isSelected = isSameDay(day, selectedDate);
                return (
                  <button
                    key={toDateStr(day)}
                    type="button"
                    className={`${styles.dateCell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
                    onClick={() => onDateSelect(day)}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
