'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { type TimeSlot } from '@/lib/api/schedule';
import { timeToPixelOffset, slotHeightPx, getSlotColors, getSlotStatusLabel } from '../utils/calendarHelpers';
import { canModifyBookedSlot } from '@/lib/utils/slotGuard.util';
import styles from './styles.module.css';

interface SlotBlockProps {
  slot: TimeSlot;
  date: string;
  role: 'admin' | 'therapist';
  onClick: (slot: TimeSlot) => void;
}

export const SlotBlock: React.FC<SlotBlockProps> = ({ slot, date, role, onClick }) => {
  const colors = getSlotColors(slot);
  const statusLabel = getSlotStatusLabel(slot);
  const top = timeToPixelOffset(slot.startTime);
  const height = slotHeightPx(slot.startTime, slot.endTime);
  const isBooked = !!slot.sessionId;
  const isLocked = role === 'therapist' && isBooked && !canModifyBookedSlot(date, slot.startTime);
  const isCompact = height <= 30;
  const showMeetLink = !isCompact && isBooked && slot.meetLink;

  return (
    <button
      type="button"
      className={`${styles.block} ${slot.isCustomized ? styles.customized : ''} ${isCompact ? styles.compact : ''}`}
      style={{
        top: top + 1,
        height: Math.max(height - 2, 18),
        backgroundColor: colors.bg,
        borderLeftColor: colors.border,
        color: colors.text,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(slot);
      }}
      title={`${slot.startTime} - ${slot.endTime} | ${statusLabel}`}
    >
      {isCompact ? (
        <span className={styles.compactText}>
          {slot.startTime} {statusLabel}
        </span>
      ) : (
        <>
          <span className={styles.slotTitle}>{statusLabel}</span>
          <span className={styles.slotTime}>
            {slot.startTime} - {slot.endTime}
          </span>
          {showMeetLink && (
            <a
              href={slot.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.meetLink}
              onClick={(e) => e.stopPropagation()}
            >
              <Icon icon="solar:videocamera-bold" width={11} height={11} />
              <span>Join Meet</span>
            </a>
          )}
        </>
      )}
      {isLocked && (
        <span className={styles.lockIcon}>
          <Icon icon="solar:lock-bold" width={10} height={10} />
        </span>
      )}
    </button>
  );
};
