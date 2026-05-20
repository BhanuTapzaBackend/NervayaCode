'use client';

import React, { useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { type TimeSlot } from '@/lib/api/schedule';
import { CalendarHeader } from './CalendarHeader';
import { CalendarSidebar } from './CalendarSidebar';
import { TimeGrid } from './TimeGrid';
import { DayColumn } from './DayColumn';
import { SlotModal } from './SlotModal';
import { useWeekNavigation } from './hooks/useWeekNavigation';
import { useWeekSchedule } from './hooks/useWeekSchedule';
import { toDateStr } from './utils/calendarHelpers';
import styles from './WeekCalendar.module.css';

interface WeekCalendarProps {
  therapistId: string;
  role: 'admin' | 'therapist';
  therapistName?: string;
  sessionDurationMins?: number;
  onBack?: () => void;
  onSlotChange?: () => void;
}

interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  date: string;
  slot: TimeSlot | null;
  defaultTime: string;
}

const INITIAL_MODAL: ModalState = {
  isOpen: false,
  mode: 'create',
  date: '',
  slot: null,
  defaultTime: '9:00 AM',
};

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  therapistId,
  role,
  therapistName,
  sessionDurationMins = 60,
  onBack,
  onSlotChange,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const { currentDate, setCurrentDate, weekStart, viewDates, headerLabel, goNext, goPrev, goToday } =
    useWeekNavigation(viewMode);
  // useWeekSchedule fetches the whole week based on weekStart, which is fine since we cache it.
  const { scheduleMap, loading, error, refetch } = useWeekSchedule(therapistId, weekStart);

  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to morning hours (start of day) on initial load
  React.useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      // Scroll to 8:30 AM (1.5 hours after 7:00 AM start, 1.5 * 60 = 90px)
      scrollContainerRef.current.scrollTop = 90;
    }
  }, []);

  const handleSlotClick = useCallback((date: string, slot: TimeSlot) => {
    setModal({ isOpen: true, mode: 'edit', date, slot, defaultTime: slot.startTime });
  }, []);

  const handleEmptyClick = useCallback((date: string, time: string) => {
    setModal({ isOpen: true, mode: 'create', date, slot: null, defaultTime: time });
  }, []);

  const handleModalClose = useCallback(() => {
    setModal(INITIAL_MODAL);
  }, []);

  const handleSuccess = useCallback(() => {
    refetch();
    onSlotChange?.();
  }, [refetch, onSlotChange]);

  const handleDateSelect = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      setViewMode('day');
    },
    [setCurrentDate],
  );

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className={styles.calendarApp}>
      <CalendarHeader
        headerLabel={headerLabel}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onToggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        therapistName={therapistName}
        onBack={onBack}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className={styles.body}>
        {sidebarOpen && (
          <CalendarSidebar
            therapistId={therapistId}
            role={role}
            selectedDate={currentDate}
            onDateSelect={handleDateSelect}
            onSlotsGenerated={handleSuccess}
            sessionDurationMins={sessionDurationMins}
            therapistName={therapistName}
          />
        )}

        <div className={styles.calendarMain}>
          {error ? (
            <div className={styles.errorState}>
              <Icon icon="solar:danger-triangle-bold" width={20} height={20} />
              <p>Failed to load schedule: {error}</p>
              <button type="button" className={styles.retryBtn} onClick={refetch}>
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <span>Loading schedule...</span>
            </div>
          ) : (
            <div className={styles.gridScroll} ref={scrollContainerRef}>
              <TimeGrid />
              <div className={styles.daysRow}>
                {viewDates.map((date, i) => {
                  const dateStr = toDateStr(date);
                  return (
                    <DayColumn
                      key={dateStr}
                      date={date}
                      _dayIndex={i}
                      slots={scheduleMap.get(dateStr) || []}
                      role={role}
                      onSlotClick={handleSlotClick}
                      onEmptyClick={handleEmptyClick}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <SlotModal
        isOpen={modal.isOpen}
        onClose={handleModalClose}
        mode={modal.mode}
        therapistId={therapistId}
        date={modal.date}
        slot={modal.slot}
        defaultTime={modal.defaultTime}
        role={role}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default WeekCalendar;
