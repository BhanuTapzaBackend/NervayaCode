'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';
import {
  MONTH_NAMES,
  DAY_NAMES,
  isSameDay,
  isDateDisabled as checkDateDisabled,
  getDaysInMonth,
  getFirstDayOfMonth,
  toDateString,
} from './datePickerUtils';

interface DatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  fullyBookedDates?: Set<string>;
  onMonthChange?: (monthStart: Date) => void;
  slotAvailability?: Map<string, number>;
}

export default function DatePicker({
  selectedDate,
  onDateSelect,
  minDate = new Date(),
  maxDate,
  fullyBookedDates,
  onMonthChange,
  slotAvailability,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  // Only sync to selectedDate's month when that month actually changes. Without this
  // guard the effect pushed a fresh Date into setCurrentMonth + onMonthChange on every
  // benign re-render, feeding the upstream Date-identity churn that caused the
  // "Too many re-renders" loop. The ref keeps month navigation working (navigateMonth
  // mutates currentMonth without retriggering this effect).
  const syncedMonthRef = useRef<string>('');

  useEffect(() => {
    const monthKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}`;
    if (syncedMonthRef.current === monthKey) return;
    syncedMonthRef.current = monthKey;
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    setCurrentMonth(monthStart);
    onMonthChange?.(monthStart);
  }, [selectedDate, onMonthChange]);

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) return true;

    return checkDateDisabled(date, minDate, maxDate, fullyBookedDates);
  };

  const isSelected = (date: Date) => isSameDay(date, selectedDate);

  const getAvailabilityStatus = (date: Date) => {
    if (isDateDisabled(date)) return 'disabled';
    if (!slotAvailability) return 'unknown';

    const availableSlots = slotAvailability.get(toDateString(date));

    if (availableSlots === 0) return 'fullyBooked';
    if (availableSlots === undefined) return 'unknown';
    if (availableSlots <= 1) return 'critical';
    if (availableSlots <= 3) return 'limited';
    return 'normal';
  };

  const getDateClassName = (date: Date) => {
    const status = getAvailabilityStatus(date);
    const baseClass = styles.day;
    const isSelectedDate = isSelected(date);

    let classes = baseClass;
    if (isSelectedDate) classes += ` ${styles.daySelected}`;

    switch (status) {
      case 'disabled':
      case 'fullyBooked':
        return `${classes} ${styles.dayDisabled}`;
      case 'critical':
        return `${classes} ${styles.dayAvailable} ${styles.dateCritical}`;
      case 'limited':
        return `${classes} ${styles.dayAvailable} ${styles.dateLimited}`;
      case 'normal':
        return `${classes} ${styles.dayAvailable} ${styles.dateNormal}`;
      case 'unknown':
        return `${classes} ${styles.dayAvailable}`;
      default:
        return classes;
    }
  };

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);

    if (minDate && newMonth < minDate) {
      const minDateYear = minDate.getFullYear();
      const minDateMonth = minDate.getMonth();
      const target = new Date(minDateYear, minDateMonth, 1);
      setCurrentMonth(target);
      onMonthChange?.(target);
      return;
    }

    if (maxDate && newMonth > maxDate) {
      const maxDateYear = maxDate.getFullYear();
      const maxDateMonth = maxDate.getMonth();
      const target = new Date(maxDateYear, maxDateMonth, 1);
      setCurrentMonth(target);
      onMonthChange?.(target);
      return;
    }

    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (!isDateDisabled(newDate)) {
      onDateSelect(newDate);
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className={styles.datePicker}>
      <div className={styles.header}>
        <div className={styles.navigation}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => navigateMonth(-1)}
            aria-label="Previous month"
            disabled={minDate && currentMonth <= new Date(minDate.getFullYear(), minDate.getMonth(), 1)}
          >
            ‹
          </button>
        </div>

        <div className={styles.monthYear}>
          <div className={styles.monthDisplay}>
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
        </div>

        <div className={styles.navigation}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => navigateMonth(1)}
            aria-label="Next month"
            disabled={maxDate && currentMonth >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)}
          >
            ›
          </button>
        </div>
      </div>

      <div className={styles.calendar}>
        <ul className={styles.dayNames} aria-label="Days of the week">
          {DAY_NAMES.map((day) => (
            <li key={day} className={styles.dayName}>
              {day}
            </li>
          ))}
        </ul>

        <div className={styles.days}>
          {days.map((day, index) => {
            if (day === null) {
              const emptyKey = `empty-${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${firstDay + index}`;
              return <div key={emptyKey} className={styles.dayEmpty} />;
            }

            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const disabled = isDateDisabled(date);
            const isSelectedDate = isSelected(date);

            return (
              <button
                key={day}
                type="button"
                className={getDateClassName(date)}
                onClick={() => handleDateClick(day)}
                disabled={disabled}
                aria-label={`Select ${date.toLocaleDateString()}`}
                aria-pressed={isSelectedDate}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
