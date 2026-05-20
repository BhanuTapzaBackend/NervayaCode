'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ICON_CALENDAR, ICON_ALERT } from '@/constants/icons';
import Sidebar from '@/components/Sidebar/LazySidebar';
import PageHeader from '@/components/PageHeader/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useTherapist } from '@/context/TherapistContext';
import { GlobalLoader } from '@/components/common';
import type { TherapistSession } from '@/lib/api/therapistApi';
import containerStyles from '@/app/(customer)/dashboard/styles.module.css';
import styles from './styles.module.css';

const SESSION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

function groupSessionsByStatus(sessions: TherapistSession[]) {
  const upcoming: TherapistSession[] = [];
  const completed: TherapistSession[] = [];
  const cancelled: TherapistSession[] = [];
  for (const s of sessions) {
    if (s.status === SESSION_STATUS.CANCELLED) cancelled.push(s);
    else if (s.status === SESSION_STATUS.COMPLETED) completed.push(s);
    else if (s.status === SESSION_STATUS.PENDING || s.status === SESSION_STATUS.CONFIRMED) upcoming.push(s);
  }
  upcoming.sort((a, b) => (a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime)));
  completed.sort((a, b) => (a.date !== b.date ? b.date.localeCompare(a.date) : b.startTime.localeCompare(a.startTime)));
  cancelled.sort((a, b) => (a.date !== b.date ? b.date.localeCompare(a.date) : b.startTime.localeCompare(a.startTime)));
  return { upcoming, completed, cancelled };
}

function formatSessionDate(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TherapistDashboardPage() {
  const { user } = useAuth();
  const { profile, sessions, loading, error } = useTherapist();
  const welcomeName = user?.name?.trim() ? user.name : 'there';
  if (loading) {
    return (
      <Sidebar>
        <div className={containerStyles.container}>
          <PageHeader title={`Welcome, ${welcomeName}`} subtitle="Therapist dashboard" />
          <GlobalLoader label="Loading dashboard..." />
        </div>
      </Sidebar>
    );
  }

  if (error && !profile) {
    return (
      <Sidebar>
        <div className={containerStyles.container}>
          <PageHeader title={`Welcome, ${welcomeName}`} subtitle="Therapist dashboard" />
          <div className={styles.notLinked} role="alert">
            <Icon icon={ICON_ALERT} width={32} height={32} />
            <p>{error}</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  const { upcoming, completed, cancelled } = groupSessionsByStatus(sessions);

  return (
    <Sidebar>
      <div className={containerStyles.container}>
        <PageHeader title={`Welcome, ${welcomeName}`} subtitle="Manage your availability and view sessions." />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Set your availability</h2>
          <p className={styles.sectionSubtitle}>Configure when you are available for sessions.</p>
          <Link href="/therapist/schedule" className={styles.ctaLink}>
            <Icon icon={ICON_CALENDAR} width={20} height={20} />
            Set your dates
          </Link>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>My sessions</h2>
          <p className={styles.sectionSubtitle}>Upcoming, completed, and cancelled sessions.</p>

          <div className={styles.sessionGroups}>
            <div className={styles.sessionBlock}>
              <h3 className={styles.statusHeading}>Upcoming</h3>
              {upcoming.length === 0 ? (
                <p className={styles.empty}>No upcoming sessions.</p>
              ) : (
                <ul className={styles.sessionList}>
                  {upcoming.map((s) => (
                    <li key={s._id} className={styles.sessionItem}>
                      <div className={styles.sessionInfo}>
                        <span className={styles.sessionDate}>{formatSessionDate(s.date)}</span>
                        <span className={styles.sessionTime}>{s.startTime}</span>
                        <span className={styles.sessionMeta}>Client ID: {s.userId}</span>
                        <span className={styles.sessionBadge}>{s.status}</span>
                      </div>
                      {s.meetLink && (
                        <a href={s.meetLink} target="_blank" rel="noopener noreferrer" className={styles.joinButton}>
                          Join Meet
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.sessionBlock}>
              <h3 className={styles.statusHeading}>Completed</h3>
              {completed.length === 0 ? (
                <p className={styles.empty}>No completed sessions.</p>
              ) : (
                <ul className={styles.sessionList}>
                  {completed.slice(0, 10).map((s) => (
                    <li key={s._id} className={styles.sessionItem}>
                      <span className={styles.sessionDate}>{formatSessionDate(s.date)}</span>
                      <span className={styles.sessionTime}>{s.startTime}</span>
                      <span className={styles.sessionMeta}>Client ID: {s.userId}</span>
                    </li>
                  ))}
                </ul>
              )}
              {completed.length > 10 && <p className={styles.more}>+{completed.length - 10} more</p>}
            </div>

            <div className={styles.sessionBlock}>
              <h3 className={styles.statusHeading}>Cancelled</h3>
              {cancelled.length === 0 ? (
                <p className={styles.empty}>No cancelled sessions.</p>
              ) : (
                <ul className={styles.sessionList}>
                  {cancelled.slice(0, 5).map((s) => (
                    <li key={s._id} className={styles.sessionItem}>
                      <span className={styles.sessionDate}>{formatSessionDate(s.date)}</span>
                      <span className={styles.sessionTime}>{s.startTime}</span>
                      <span className={styles.sessionMeta}>Client ID: {s.userId}</span>
                    </li>
                  ))}
                </ul>
              )}
              {cancelled.length > 5 && <p className={styles.more}>+{cancelled.length - 5} more</p>}
            </div>
          </div>
        </section>
      </div>
    </Sidebar>
  );
}
