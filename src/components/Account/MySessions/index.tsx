'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { sessionsApi } from '@/lib/api/sessions';
import { Session } from '@/types/session.types';
import { Therapist } from '@/types/therapist.types';
import { Pagination, GlobalLoader } from '@/components/common';
import { PAGE_SIZE_3 } from '@/lib/constants/pagination.constants';
import styles from './styles.module.css';
import { Icon } from '@iconify/react';
import { ICON_CALENDAR } from '@/constants/icons';
import { toast } from 'sonner';

// Sub-components
import TherapySessionCard from './TherapySessionCard';
import SessionDetailModal from './SessionDetailModal';

const BookingModal = dynamic(() => import('@/components/Booking/BookingModal'), { ssr: false });

export function MySessions() {
  const [therapySessions, setTherapySessions] = useState<Session[]>([]);
  const [loadingTherapy, setLoadingTherapy] = useState(true);
  const [errorTherapy, setErrorTherapy] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [reschedulingSession, setReschedulingSession] = useState<Session | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [mounted, setMounted] = useState(false);

  const limit = PAGE_SIZE_3;

  // Therapy Logic
  const totalTherapy = therapySessions.length;
  const totalPagesTherapy = Math.max(1, Math.ceil(totalTherapy / limit));
  const paginatedTherapy = useMemo(
    () => therapySessions.slice((page - 1) * limit, page * limit),
    [therapySessions, page, limit],
  );

  useEffect(() => {
    setMounted(true);
    fetchTherapySessions();
  }, []);

  const fetchTherapySessions = async () => {
    try {
      setLoadingTherapy(true);
      const result = await sessionsApi.getForUser();
      setTherapySessions(result.data || []);
    } catch (_err) {
      setErrorTherapy(_err instanceof Error ? _err.message : 'Error loading therapy sessions');
    } finally {
      setLoadingTherapy(false);
    }
  };

  const calculateDuration = (_startTime: string, _endTime: string) => {
    return '60 minutes';
  };

  const handleCancelSession = async (session: Session) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to cancel this session? This action cannot be undone.')) {
      return;
    }

    try {
      setIsCancelling(true);
      const response = await sessionsApi.cancel(session._id);
      if (response.success) {
        toast.success('Session cancelled successfully');
        setSelectedSession(null);
        fetchTherapySessions();
      } else {
        toast.error(response.message || 'Failed to cancel session');
      }
    } catch (_err) {
      toast.error('Error cancelling session');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRescheduleClick = useCallback((session: Session) => {
    setReschedulingSession(session);
  }, []);

  if (loadingTherapy && !mounted) {
    return (
      <div className={styles.container}>
        <GlobalLoader label="Loading your sessions..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>My Sessions</h2>
      <p className={styles.subheading}>Manage your therapy sessions</p>

      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <div className={styles.iconCircle}>
              <Icon icon={ICON_CALENDAR} className={styles.sectionIcon} />
            </div>
            <h3 className={styles.sectionTitle}>Therapy Sessions</h3>
            <span className={styles.badgeCount}>{therapySessions.length}</span>
          </div>
        </div>

        {errorTherapy ? (
          <div className={styles.error}>{errorTherapy}</div>
        ) : therapySessions.length === 0 && !loadingTherapy ? (
          <div className={styles.emptyState}>
            <p>No therapy sessions booked yet</p>
          </div>
        ) : (
          <div className={styles.sessionsList}>
            {paginatedTherapy.map((session) => (
              <TherapySessionCard
                key={session._id}
                session={session}
                onViewDetails={setSelectedSession}
                onReschedule={handleRescheduleClick}
              />
            ))}
          </div>
        )}

        {totalTherapy > limit && (
          <div className={styles.paginationWrap}>
            <Pagination
              page={page}
              limit={limit}
              total={totalTherapy}
              totalPages={totalPagesTherapy}
              onPageChange={setPage}
              ariaLabel="Therapy sessions pagination"
            />
          </div>
        )}
      </div>

      {mounted &&
        selectedSession &&
        createPortal(
          <SessionDetailModal
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
            onCancel={handleCancelSession}
            calculateDuration={calculateDuration}
            isCancelling={isCancelling}
          />,
          document.body,
        )}

      {mounted && reschedulingSession && (
        <BookingModal
          therapistId={
            (reschedulingSession.therapistId as unknown as Therapist)._id ||
            (reschedulingSession.therapistId as unknown as string)
          }
          therapistName={(reschedulingSession.therapistId as unknown as Therapist).name || 'Therapist'}
          rescheduleSessionId={reschedulingSession._id}
          onClose={() => setReschedulingSession(null)}
          onSuccess={() => {
            fetchTherapySessions();
            setReschedulingSession(null);
          }}
        />
      )}
    </div>
  );
}
