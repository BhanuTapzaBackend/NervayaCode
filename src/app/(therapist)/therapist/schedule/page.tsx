'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

import PageHeader from '@/components/PageHeader/PageHeader';
import { WeekCalendar } from '@/components/WeekCalendar';
import { GlobalLoader } from '@/components/common';
import { useTherapist } from '@/context/TherapistContext';
import { ICON_ALERT } from '@/constants/icons';
import styles from './styles.module.css';

/**
 * Availability editor.
 *
 * Chrome comes from `(therapist)/layout.tsx` — this page no longer mounts a
 * sidebar of its own.
 */
export default function TherapistSchedulePage() {
  const router = useRouter();
  const { profile, loading, error } = useTherapist();
  const therapistId = profile?._id?.toString() || null;

  if (loading) {
    return (
      <div className={styles.container}>
        <PageHeader title="Availability" subtitle="Choose when you can be booked" />
        <GlobalLoader label="Loading schedule..." />
      </div>
    );
  }

  if (error || !therapistId) {
    return (
      <div className={styles.errorWrap}>
        <div className={styles.errorBox}>
          <Icon icon={ICON_ALERT} width={32} height={32} />
          <p>{error || 'Therapist profile not found.'}</p>
          <button type="button" onClick={() => router.push('/therapist/dashboard')} className={styles.backBtn}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fullPage}>
      <WeekCalendar
        therapistId={therapistId}
        role="therapist"
        therapistName={profile?.name}
        sessionDurationMins={profile?.sessionDurationMins || 60}
      />
    </div>
  );
}
