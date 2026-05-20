'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Modal from '@/components/common/Modal/Modal';
import { type TimeSlot, scheduleApi } from '@/lib/api/schedule';
import api from '@/lib/axios';
import { canModifyBookedSlot } from '@/lib/utils/slotGuard.util';
import { getSlotColors, getSlotStatusLabel } from '../utils/calendarHelpers';
import { toast } from 'sonner';
import styles from './styles.module.css';

type ModalMode = 'create' | 'edit';

interface SlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ModalMode;
  therapistId: string;
  date: string;
  slot?: TimeSlot | null;
  defaultTime?: string;
  role: 'admin' | 'therapist';
  onSuccess: () => void;
}

const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 20; h++) {
  for (const m of [0, 30]) {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    TIME_OPTIONS.push(`${displayH}:${String(m).padStart(2, '0')} ${period}`);
  }
}

export const SlotModal: React.FC<SlotModalProps> = ({
  isOpen,
  onClose,
  mode,
  therapistId,
  date,
  slot,
  defaultTime,
  role,
  onSuccess,
}) => {
  const [startTime, setStartTime] = useState(defaultTime || '9:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [saving, setSaving] = useState(false);
  const [meetLinkInput, setMeetLinkInput] = useState(slot?.meetLink || '');

  const isBooked = !!slot?.sessionId;
  const isLocked = role === 'therapist' && isBooked && !canModifyBookedSlot(date, slot?.startTime || '');

  const handleSaveMeetLink = async () => {
    if (!slot?.sessionId) return;
    setSaving(true);
    try {
      await api.put(`/sessions/${slot.sessionId}`, { meetLink: meetLinkInput });
      toast.success('Meet link updated');
      onSuccess();
    } catch {
      toast.error('Failed to update meet link');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const result = await scheduleApi.createSlot(therapistId, {
        date,
        startTime,
        endTime,
      });
      if (result.success) {
        toast.success('Slot created successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Failed to create slot');
      }
    } catch {
      toast.error('Failed to create slot');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!slot) return;
    setSaving(true);
    try {
      const result = await scheduleApi.updateSlot(therapistId, {
        date,
        startTime: slot.startTime,
        updates: { isAvailable: !slot.isAvailable },
      });
      if (result.success) {
        toast.success(`Slot ${slot.isAvailable ? 'blocked' : 'unblocked'} successfully`);
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Failed to update slot');
      }
    } catch {
      toast.error('Failed to update slot');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slot) return;
    setSaving(true);
    try {
      const result = await scheduleApi.deleteSlot(therapistId, date, slot.startTime);
      if (result.success) {
        toast.success('Slot deleted successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Failed to delete slot');
      }
    } catch {
      toast.error('Failed to delete slot');
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = (() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? 'Add New Slot' : 'Slot Details'}>
      <div className={styles.content}>
        <div className={styles.dateDisplay}>
          <Icon icon="solar:calendar-bold" width={18} height={18} />
          <span>{formattedDate}</span>
        </div>

        {mode === 'create' && (
          <>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="slot-start-time">
                Start Time
              </label>
              <select
                id="slot-start-time"
                className={styles.select}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="slot-end-time">
                End Time
              </label>
              <select
                id="slot-end-time"
                className={styles.select}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className={styles.primaryBtn} onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create Slot'}
            </button>
          </>
        )}

        {mode === 'edit' && slot && (
          <>
            <div className={styles.slotInfo}>
              <div className={styles.timeRange}>
                <Icon icon="solar:clock-circle-bold" width={16} height={16} />
                <span>
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
              <div
                className={styles.statusBadge}
                style={{
                  backgroundColor: getSlotColors(slot).bg,
                  color: getSlotColors(slot).text,
                  borderColor: getSlotColors(slot).border,
                }}
              >
                {getSlotStatusLabel(slot)}
              </div>
              {slot.isCustomized && <span className={styles.customBadge}>Custom Slot</span>}
            </div>

            {/* Meet link section for booked slots */}
            {isBooked && role === 'admin' && (
              <div className={styles.meetLinkSection}>
                <label className={styles.label} htmlFor="meet-link-input">
                  <Icon icon="solar:link-circle-bold" width={14} height={14} />
                  Google Meet Link
                </label>
                <div className={styles.meetLinkRow}>
                  <input
                    id="meet-link-input"
                    type="url"
                    className={styles.meetLinkInput}
                    placeholder="https://meet.google.com/..."
                    value={meetLinkInput}
                    onChange={(e) => setMeetLinkInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.meetLinkSaveBtn}
                    onClick={handleSaveMeetLink}
                    disabled={saving || meetLinkInput === (slot?.meetLink || '')}
                  >
                    Save
                  </button>
                </div>
                {slot?.meetLink && (
                  <a href={slot.meetLink} target="_blank" rel="noopener noreferrer" className={styles.meetLinkPreview}>
                    <Icon icon="solar:videocamera-record-bold" width={12} height={12} />
                    {slot.meetLink}
                  </a>
                )}
              </div>
            )}

            {isBooked && role !== 'admin' && slot?.meetLink && (
              <div className={styles.meetLinkSection}>
                <label className={styles.label}>
                  <Icon icon="solar:link-circle-bold" width={14} height={14} />
                  Meeting Link
                </label>
                <a href={slot.meetLink} target="_blank" rel="noopener noreferrer" className={styles.meetLinkPreview}>
                  <Icon icon="solar:videocamera-record-bold" width={12} height={12} />
                  {slot.meetLink}
                </a>
              </div>
            )}

            {isLocked && (
              <div className={styles.lockNotice}>
                <Icon icon="solar:lock-bold" width={16} height={16} />
                <span>This booked slot cannot be modified within 48 hours of the session.</span>
              </div>
            )}

            {!isLocked && (
              <div className={styles.actions}>
                {!isBooked && (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={handleToggleAvailability}
                    disabled={saving}
                  >
                    <Icon
                      icon={slot.isAvailable ? 'solar:close-circle-bold' : 'solar:check-circle-bold'}
                      width={16}
                      height={16}
                    />
                    {saving ? 'Updating...' : slot.isAvailable ? 'Block Slot' : 'Unblock Slot'}
                  </button>
                )}
                {!isBooked && (
                  <button type="button" className={styles.dangerBtn} onClick={handleDelete} disabled={saving}>
                    <Icon icon="solar:trash-bin-trash-bold" width={16} height={16} />
                    {saving ? 'Deleting...' : 'Delete Slot'}
                  </button>
                )}
                {isBooked && (
                  <p className={styles.bookedNote}>
                    This slot is booked ({getSlotStatusLabel(slot)}). Cancel the session to free this slot.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
