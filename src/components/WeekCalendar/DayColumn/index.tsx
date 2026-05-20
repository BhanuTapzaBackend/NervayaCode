'use client';

import React, { useCallback } from 'react';
import { type TimeSlot } from '@/lib/api/schedule';
import { SlotBlock } from '../SlotBlock';
import {
  isSameDay,
  toDateStr,
  HOUR_HEIGHT,
  DAY_START_HOUR,
  DAY_END_HOUR,
  pixelOffsetToTime,
} from '../utils/calendarHelpers';
import styles from './styles.module.css';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const totalHours = DAY_END_HOUR - DAY_START_HOUR;

interface DayColumnProps {
  date: Date;
  slots: TimeSlot[];
  role: 'admin' | 'therapist';
  _dayIndex: number;
  onSlotClick: (date: string, slot: TimeSlot) => void;
  onEmptyClick: (date: string, time: string) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({ date, slots, role, onSlotClick, onEmptyClick }) => {
  const dateStr = toDateStr(date);
  const isToday = isSameDay(date, new Date());
  const dayNum = date.getDate();
  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday...

  const handleEmptyClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const time = pixelOffsetToTime(offsetY);
      onEmptyClick(dateStr, time);
    },
    [dateStr, onEmptyClick],
  );

  const handleSlotClick = useCallback(
    (slot: TimeSlot) => {
      onSlotClick(dateStr, slot);
    },
    [dateStr, onSlotClick],
  );

  // Current time line
  const now = new Date();
  let currentTimeTop: number | null = null;
  if (isToday) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const dayStartMinutes = DAY_START_HOUR * 60;
    const dayEndMinutes = DAY_END_HOUR * 60;
    if (currentMinutes >= dayStartMinutes && currentMinutes <= dayEndMinutes) {
      currentTimeTop = ((currentMinutes - dayStartMinutes) / 60) * HOUR_HEIGHT;
    }
  }

  return (
    <div className={styles.column}>
      {/* Day header: Standard Google Calendar Style */}
      <div className={`${styles.dayHeader} ${isToday ? styles.today : ''}`}>
        <span className={styles.dayName}>{DAY_NAMES[dayOfWeek]}</span>
        <span className={`${styles.dayNum} ${isToday ? styles.todayNum : ''}`}>{dayNum}</span>
      </div>

      {/* Slot grid area */}
      <div
        className={styles.slotsArea}
        style={{ height: totalHours * HOUR_HEIGHT }}
        onClick={handleEmptyClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleEmptyClick(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Add slot on ${dateStr}`}
      >
        {/* Current time indicator */}
        {currentTimeTop !== null && (
          <div className={styles.currentTime} style={{ top: currentTimeTop }}>
            <div className={styles.currentTimeDot} />
            <div className={styles.currentTimeLine} />
          </div>
        )}

        {/* Slot blocks */}
        {slots.map((slot) => (
          <SlotBlock
            key={`${slot.startTime}-${slot.endTime}`}
            slot={slot}
            date={dateStr}
            role={role}
            onClick={handleSlotClick}
          />
        ))}
      </div>
    </div>
  );
};
