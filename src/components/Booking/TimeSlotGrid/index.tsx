'use client';

import { useState, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT, ICON_SUNRISE, ICON_SUN, ICON_MOON } from '@/constants/icons';
import { TherapistSlot } from '@/types/session.types';
import styles from './styles.module.css';

interface TimeSlotGridProps {
  slots: TherapistSlot[];
  selectedSlot: string | null;
  onSlotSelect: (slotId: string, startTime?: string) => void;
}

type TimePeriod = 'Morning' | 'Afternoon' | 'Evening';

interface GroupedSlots {
  period: TimePeriod;
  slots: TherapistSlot[];
}

function getTimePeriod(time: string): TimePeriod {
  const hour = parseInt(time.split(':')[0]);
  const isPM = time.includes('PM');
  const hour24 = isPM && hour !== 12 ? hour + 12 : !isPM && hour === 12 ? 0 : hour;

  if (hour24 < 12) {
    return 'Morning';
  }
  if (hour24 < 17) {
    return 'Afternoon';
  }
  return 'Evening';
}

function groupSlotsByPeriod(slots: TherapistSlot[]): GroupedSlots[] {
  const grouped: Record<TimePeriod, TherapistSlot[]> = {
    Morning: [],
    Afternoon: [],
    Evening: [],
  };

  slots.forEach((slot) => {
    const period = getTimePeriod(slot.startTime);
    grouped[period].push(slot);
  });

  const periods: TimePeriod[] = ['Morning', 'Afternoon', 'Evening'];
  const result: GroupedSlots[] = periods
    .map((period) => ({
      period,
      slots: grouped[period],
    }))
    .filter((group) => group.slots.length > 0);

  return result;
}

const formatTimeDisplay = (timeStr: string) => {
  if (/^\d:/.test(timeStr)) {
    return `0${timeStr}`;
  }
  return timeStr;
};
const getPeriodIconConfig = (period: TimePeriod) => {
  switch (period) {
    case 'Morning':
      return { icon: ICON_SUNRISE, color: 'var(--color-warning)' };
    case 'Afternoon':
      return { icon: ICON_SUN, color: 'var(--color-info)' };
    case 'Evening':
      return { icon: ICON_MOON, color: 'var(--color-indigo-400)' };
    default:
      return { icon: ICON_SUNRISE, color: 'var(--color-warning)' };
  }
};

export default function TimeSlotGrid({ slots, selectedSlot, onSlotSelect }: TimeSlotGridProps) {
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);

  const groupedSlots = useMemo(() => groupSlotsByPeriod(slots), [slots]);
  const maxPeriodIndex = groupedSlots.length > 0 ? groupedSlots.length - 1 : 0;

  const goPrev = useCallback(() => {
    setCurrentPeriodIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentPeriodIndex((i) => Math.min(maxPeriodIndex, i + 1));
  }, [maxPeriodIndex]);

  if (slots.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No slots available for this date.</p>
          <p className={styles.emptySubtext}>Please select another date or contact support.</p>
        </div>
      </div>
    );
  }

  const currentGroup = groupedSlots[currentPeriodIndex];
  if (!currentGroup) {
    return null;
  }

  const canGoPrev = currentPeriodIndex > 0;
  const canGoNext = currentPeriodIndex < groupedSlots.length - 1;
  const availableCount = currentGroup.slots.filter((s) => s.isAvailable).length;

  return (
    <div className={styles.container}>
      <div className={styles.periodNav}>
        <button
          type="button"
          className={styles.periodNavButton}
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="Previous time period (e.g. Morning)"
        >
          <Icon icon={ICON_CHEVRON_LEFT} width={20} height={20} aria-hidden />
        </button>
        <div className={styles.periodNavLabel}>
          <span className={styles.periodIcon} style={{ color: getPeriodIconConfig(currentGroup.period).color }}>
            <Icon icon={getPeriodIconConfig(currentGroup.period).icon} width={20} height={20} />
          </span>
          <span>{currentGroup.period}</span>
          <span className={styles.periodCount}>({availableCount} available)</span>
        </div>
        <button
          type="button"
          className={styles.periodNavButton}
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="Next time period (e.g. Evening)"
        >
          <Icon icon={ICON_CHEVRON_RIGHT} width={20} height={20} aria-hidden />
        </button>
      </div>

      <div className={styles.periodGroup}>
        <ul className={styles.grid} aria-label="Time slots">
          {currentGroup.slots.map((slot) => {
            const isSelected = selectedSlot === slot._id;
            const isBooked = !slot.isAvailable;
            const isCustomized = slot.isCustomized;

            let slotClassName = styles.slot;
            if (isBooked) {
              slotClassName += ` ${styles.booked}`;
            } else if (isSelected) {
              slotClassName += ` ${styles.selected}`;
            } else if (isCustomized) {
              slotClassName += ` ${styles.customized}`;
            }

            return (
              <li key={slot._id}>
                <button
                  type="button"
                  className={slotClassName}
                  onClick={() => onSlotSelect(slot._id)}
                  disabled={isBooked}
                  aria-label={`Select ${slot.startTime} to ${slot.endTime}`}
                  aria-pressed={isSelected}
                >
                  <span className={styles.time}>{formatTimeDisplay(slot.startTime)}</span>
                  {slot.endTime && <span className={styles.timeRange}>{formatTimeDisplay(slot.endTime)}</span>}
                  {isCustomized && (
                    <span className={styles.customizedBadge} title="Customized slot">
                      ⭐
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
