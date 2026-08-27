'use client';

import { Icon } from '@iconify/react';

import { useTherapistDashboard } from '@/context/TherapistDashboardContext';
import { DashboardCalendar } from '@/components/Therapist/DashboardCalendar';
import {
  PendingRequestsCard,
  RecentCompletedCard,
  StatusLegend,
  UpcomingSessionsCard,
} from '@/components/Therapist/DashboardPanels';
import { StatCards } from '@/components/Therapist/StatCards';
import { ICON_ALERT } from '@/constants/icons';
import styles from './styles.module.css';

export default function TherapistDashboardPage() {
  const { data, isLoading, error, rangeStart, view, setView, setRangeStart } = useTherapistDashboard();

  if (error) {
    return (
      <div className={styles.errorBox} role="alert">
        <Icon icon={ICON_ALERT} width={28} height={28} />
        <p>We couldn&apos;t load your dashboard. Refresh to try again.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <StatCards counts={data?.counts} />

      <div className={styles.body}>
        <DashboardCalendar
          sessions={data?.sessions ?? []}
          rangeStart={rangeStart}
          view={view}
          onViewChange={setView}
          onRangeStartChange={setRangeStart}
          isLoading={isLoading}
        />

        <aside className={styles.rail}>
          <StatusLegend />
          <UpcomingSessionsCard sessions={data?.upcoming ?? []} />
        </aside>
      </div>

      <div className={styles.bottomRow}>
        <RecentCompletedCard sessions={data?.recentCompleted ?? []} />
        <PendingRequestsCard sessions={data?.pendingRequests ?? []} />
      </div>
    </div>
  );
}
