'use client';

import { Icon } from '@iconify/react';

import type { TherapistSessionView } from '@/lib/api/therapistApi';
import { formatIstTimeRange, istEndMinutes, istMinutesOfDay, toIsoDayKey } from '@/utils/therapistDate';
import { ICON_CHECK } from '@/constants/icons';
import { layoutOverlaps } from './layoutOverlaps';
import styles from './styles.module.css';

/** Pixels per hour. Drives every vertical measurement in the grid. */
const HOUR_HEIGHT = 56;

interface CalendarGridProps {
  days: Date[];
  byDay: Map<string, TherapistSessionView[]>;
  startHour: number;
  endHour: number;
  /** Minutes since IST midnight, or null when today is not in view. */
  nowMinute: number | null;
  isToday: (day: Date) => boolean;
  isLoading: boolean;
}

const STATUS_CLASS: Record<string, string> = {
  confirmed: styles.eventConfirmed,
  pending: styles.eventPending,
  completed: styles.eventCompleted,
  cancelled: styles.eventCancelled,
};

const weekdayFormatter = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' });
const dayNumberFormatter = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' });

function hourLabel(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${period}`;
}

export function CalendarGrid({ days, byDay, startHour, endHour, nowMinute, isToday, isLoading }: CalendarGridProps) {
  const hours = Array.from({ length: Math.max(1, endHour - startHour) }, (_, i) => startHour + i);
  const gridHeight = hours.length * HOUR_HEIGHT;

  const offsetFor = (minutes: number) => ((minutes - startHour * 60) / 60) * HOUR_HEIGHT;

  return (
    <div className={styles.gridScroll}>
      <div className={styles.grid} style={{ '--day-count': days.length } as React.CSSProperties}>
        {/* Header row */}
        <div className={styles.gutterHead}>Time</div>
        {days.map((day) => (
          <div key={`head-${toIsoDayKey(day)}`} className={styles.dayHead}>
            <span className={styles.dayName}>{weekdayFormatter.format(day).toUpperCase()}</span>
            <span className={`${styles.dayNumber} ${isToday(day) ? styles.dayNumberToday : ''}`}>
              {dayNumberFormatter.format(day)}
            </span>
          </div>
        ))}

        {/* Time gutter */}
        <div className={styles.gutter} style={{ height: gridHeight }}>
          {hours.map((hour) => (
            <div key={hour} className={styles.hourLabel} style={{ height: HOUR_HEIGHT }}>
              <span>{hourLabel(hour)}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const key = toIsoDayKey(day);
          const positioned = layoutOverlaps(byDay.get(key) ?? []);

          return (
            <div key={`col-${key}`} className={styles.dayColumn} style={{ height: gridHeight }}>
              {hours.map((hour) => (
                <div key={hour} className={styles.hourCell} style={{ height: HOUR_HEIGHT }} />
              ))}

              {isToday(day) && nowMinute !== null && nowMinute >= startHour * 60 && nowMinute <= endHour * 60 && (
                <div className={styles.nowLine} style={{ top: offsetFor(nowMinute) }} aria-hidden="true">
                  <span className={styles.nowDot} />
                </div>
              )}

              {positioned.map(({ session, leftPct, widthPct }) => {
                const top = offsetFor(istMinutesOfDay(session.startAt));
                const height = Math.max(
                  28,
                  ((istEndMinutes(session.startAt, session.endAt) - istMinutesOfDay(session.startAt)) / 60) *
                    HOUR_HEIGHT,
                );

                return (
                  <article
                    key={session._id}
                    className={`${styles.event} ${STATUS_CLASS[session.status] ?? ''}`}
                    style={{ top, height, left: `${leftPct}%`, width: `calc(${widthPct}% - 4px)` }}
                  >
                    <span className={styles.eventName}>
                      {session.client?.name ?? 'Client'}
                      {session.status === 'completed' && (
                        <Icon icon={ICON_CHECK} width={13} height={13} aria-label="Completed" />
                      )}
                    </span>
                    <span className={styles.eventTime}>{formatIstTimeRange(session.startAt, session.endAt)}</span>
                    <span className={styles.eventMeta}>
                      {session.isNewClient ? 'New client' : session.durationLabel}
                    </span>
                  </article>
                );
              })}
            </div>
          );
        })}
      </div>

      {isLoading && <div className={styles.loadingVeil}>Loading…</div>}
    </div>
  );
}
