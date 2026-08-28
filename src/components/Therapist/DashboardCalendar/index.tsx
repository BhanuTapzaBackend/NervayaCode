'use client';

import { useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';

import type { TherapistSessionView } from '@/lib/api/therapistApi';
import { addDays, formatRangeLabel, istEndMinutes, istMinutesOfDay, toIsoDayKey } from '@/utils/therapistDate';
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT, ICON_FILTER } from '@/constants/icons';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { CalendarGrid } from './CalendarGrid';
import { useCurrentIstMinute, useTodayIstKey } from './useCurrentIstMinute';
import styles from './styles.module.css';

import type { CalendarView } from '@/context/TherapistDashboardContext';

interface DashboardCalendarProps {
  sessions: TherapistSessionView[];
  rangeStart: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onRangeStartChange: (start: Date) => void;
  isLoading?: boolean;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'confirmed', label: 'Upcoming' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]['value'];

export function DashboardCalendar({
  sessions,
  rangeStart,
  view,
  onViewChange,
  onRangeStartChange,
  isLoading = false,
}: DashboardCalendarProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isFilterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useModalDismiss(isFilterOpen, filterRef, () => setFilterOpen(false));
  const nowMinute = useCurrentIstMinute();
  const todayKey = useTodayIstKey();

  const days = view === 'day' ? 1 : 7;
  const dayList = useMemo(
    () => Array.from({ length: days }, (_, index) => addDays(rangeStart, index)),
    [rangeStart, days],
  );

  const visible = useMemo(
    () => (statusFilter === 'all' ? sessions : sessions.filter((s) => s.status === statusFilter)),
    [sessions, statusFilter],
  );

  /**
   * Vertical bounds of the grid, derived from what is actually scheduled rather
   * than hardcoded. A fixed 7am–9pm window wastes half the height for a
   * therapist who only works mornings, and clips one who starts at 7am.
   */
  const { startHour, endHour } = useMemo(() => {
    // Derived from ALL sessions, not the filtered set — otherwise choosing
    // "Cancelled" with one 3pm session shrinks the grid to two hours and the
    // day appears to change shape.
    if (!sessions.length) return { startHour: 8, endHour: 18 };
    const starts = sessions.map((s) => Math.floor(istMinutesOfDay(s.startAt) / 60));
    // istEndMinutes unwraps a session that ends at midnight, which otherwise
    // reports 0 and inverts the range.
    const ends = sessions.map((s) => Math.ceil(istEndMinutes(s.startAt, s.endAt) / 60));
    return {
      startHour: Math.max(0, Math.min(...starts) - 1),
      endHour: Math.min(24, Math.max(...ends) + 1),
    };
  }, [sessions]);

  const byDay = useMemo(() => {
    const map = new Map<string, TherapistSessionView[]>();
    for (const session of visible) {
      const key = toIsoDayKey(new Date(session.startAt));
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    return map;
  }, [visible]);

  const shift = (direction: -1 | 1) => onRangeStartChange(addDays(rangeStart, direction * days));

  return (
    <section className={styles.panel}>
      <header className={styles.toolbar}>
        <div className={styles.navGroup}>
          <button type="button" className={styles.todayBtn} onClick={() => onRangeStartChange(addDays(new Date(), 0))}>
            Today
          </button>
          <button type="button" className={styles.iconBtn} onClick={() => shift(-1)} aria-label="Previous">
            <Icon icon={ICON_CHEVRON_LEFT} width={18} height={18} />
          </button>
          <button type="button" className={styles.iconBtn} onClick={() => shift(1)} aria-label="Next">
            <Icon icon={ICON_CHEVRON_RIGHT} width={18} height={18} />
          </button>
          <h2 className={styles.rangeTitle}>{formatRangeLabel(rangeStart, days)}</h2>
        </div>

        <div className={styles.controls}>
          <div className={styles.segmented} role="group" aria-label="Calendar view">
            {(['day', 'week'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`${styles.segment} ${view === option ? styles.segmentActive : ''}`}
                onClick={() => onViewChange(option)}
                aria-pressed={view === option}
              >
                {option === 'day' ? 'Day' : 'Week'}
              </button>
            ))}
          </div>

          <div className={styles.filterWrap} ref={filterRef}>
            <button
              type="button"
              className={`${styles.filterBtn} ${statusFilter !== 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilterOpen((open) => !open)}
              aria-expanded={isFilterOpen}
              aria-haspopup="true"
            >
              <Icon icon={ICON_FILTER} width={16} height={16} aria-hidden="true" />
              {STATUS_FILTERS.find((f) => f.value === statusFilter)?.label ?? 'Filter'}
            </button>

            {isFilterOpen && (
              <div className={styles.filterMenu}>
                {STATUS_FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.filterOption} ${statusFilter === option.value ? styles.filterOptionActive : ''}`}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setFilterOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <CalendarGrid
        days={dayList}
        byDay={byDay}
        startHour={startHour}
        endHour={endHour}
        nowMinute={nowMinute}
        isToday={(day) => todayKey !== null && toIsoDayKey(day) === todayKey}
        isLoading={isLoading}
      />
    </section>
  );
}

export default DashboardCalendar;
