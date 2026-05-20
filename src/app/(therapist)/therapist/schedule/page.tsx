'use client';

import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/LazySidebar';
import PageHeader from '@/components/PageHeader/PageHeader';
import { WeekCalendar } from '@/components/WeekCalendar';
import { GlobalLoader } from '@/components/common';
import { useTherapist } from '@/context/TherapistContext';
import { Icon } from '@iconify/react';
import styles from './styles.module.css';

export default function TherapistSchedulePage() {
  const router = useRouter();
  const { profile, loading, error } = useTherapist();
  const therapistId = profile?._id?.toString() || null;
  if (loading) {
    return (
      <Sidebar>
        <div className={styles.container}>
          <PageHeader title="Set your dates" subtitle="Manage your availability" />
          <GlobalLoader label="Loading schedule..." />
        </div>
      </Sidebar>
    );
  }

  if (error || !therapistId) {
    return (
      <Sidebar>
        <div className={styles.errorWrap}>
          <div className={styles.errorBox}>
            <Icon icon="solar:danger-triangle-bold" width={32} height={32} />
            <p>{error || 'Therapist profile not found.'}</p>
            <button type="button" onClick={() => router.push('/therapist/dashboard')} className={styles.backBtn}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className={styles.fullPage}>
        <WeekCalendar
          therapistId={therapistId}
          role="therapist"
          therapistName={profile?.name}
          sessionDurationMins={profile?.sessionDurationMins || 60}
        />
      </div>
    </Sidebar>
  );
}
