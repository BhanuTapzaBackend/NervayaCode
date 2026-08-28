'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';

import type { TherapistSessionView } from '@/lib/api/therapistApi';
import { formatIstTimeRange } from '@/utils/therapistDate';
import { ICON_CHEVRON_RIGHT } from '@/constants/icons';
import styles from './styles.module.css';

/** Shared white card used by the rail and the bottom row. */
export function PanelCard({
  title,
  action,
  footer,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  footer?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <section className={styles.card}>
      <header className={styles.cardHead}>
        <h2 className={styles.cardTitle}>{title}</h2>
        {action && (
          <Link href={action.href} className={styles.cardAction}>
            {action.label}
          </Link>
        )}
      </header>

      {children}

      {footer && (
        <Link href={footer.href} className={styles.cardFooter}>
          {footer.label}
          <Icon icon={ICON_CHEVRON_RIGHT} width={14} height={14} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}

const LEGEND = [
  { label: 'Upcoming', tone: styles.dotSuccess },
  { label: 'Pending', tone: styles.dotWarning },
  { label: 'Completed', tone: styles.dotNeutral },
  { label: 'Cancelled', tone: styles.dotError },
] as const;

export function StatusLegend() {
  return (
    <PanelCard title="Session status">
      <ul className={styles.legend}>
        {LEGEND.map((item) => (
          <li key={item.label} className={styles.legendRow}>
            <span className={`${styles.dot} ${item.tone}`} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}

const STATUS_DOT: Record<string, string> = {
  confirmed: styles.dotSuccess,
  pending: styles.dotWarning,
  completed: styles.dotNeutral,
  cancelled: styles.dotError,
};

/** Compact session row, shared by the upcoming and completed lists. */
function SessionRow({ session }: { session: TherapistSessionView }) {
  return (
    <li className={styles.sessionRow}>
      <span className={`${styles.dot} ${STATUS_DOT[session.status] ?? ''}`} aria-hidden="true" />
      <span className={styles.sessionBody}>
        <span className={styles.sessionName}>{session.client?.name ?? 'Client'}</span>
        <span className={styles.sessionTime}>{formatIstTimeRange(session.startAt, session.endAt)}</span>
      </span>
      {session.meetLink && session.status !== 'completed' && (
        <a href={session.meetLink} target="_blank" rel="noopener noreferrer" className={styles.joinBtn}>
          Join
        </a>
      )}
    </li>
  );
}

export function UpcomingSessionsCard({ sessions }: { sessions: TherapistSessionView[] }) {
  return (
    <PanelCard title="Upcoming sessions" footer={{ label: 'View full schedule', href: '/therapist/calendar' }}>
      {sessions.length === 0 ? (
        <p className={styles.empty}>Nothing scheduled yet.</p>
      ) : (
        <ul className={styles.sessionList}>
          {sessions.map((session) => (
            <SessionRow key={session._id} session={session} />
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

/**
 * Sessions still sitting at `pending`.
 *
 * Read-only on purpose. The mockup pairs these with Accept / Decline, but these
 * bookings are ALREADY PAID (createSession stamps `pending` inside
 * processPaymentSuccess) and there is no refund path — a one-click Decline
 * would cancel a paid session with no way to make the customer whole. Until
 * that exists, showing the queue is honest; acting on it here would not be.
 */
export function PendingRequestsCard({ sessions }: { sessions: TherapistSessionView[] }) {
  return (
    <PanelCard title="Pending requests" action={{ label: 'View all', href: '/therapist/calendar' }}>
      {sessions.length === 0 ? (
        <p className={styles.empty}>Nothing waiting on you.</p>
      ) : (
        <ul className={styles.sessionList}>
          {sessions.map((session) => (
            <li key={session._id} className={styles.completedRow}>
              <span className={styles.avatar} aria-hidden="true">
                {(session.client?.name ?? 'C').charAt(0).toUpperCase()}
              </span>
              <span className={styles.sessionBody}>
                <span className={styles.sessionName}>{session.client?.name ?? 'Client'}</span>
                <span className={styles.sessionTime}>
                  {formatIstTimeRange(session.startAt, session.endAt)}
                  {session.isNewClient ? ' · New client' : ''}
                </span>
              </span>
              <span className={styles.pendingBadge}>Pending</span>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

export function RecentCompletedCard({ sessions }: { sessions: TherapistSessionView[] }) {
  return (
    <PanelCard title="Recent completed sessions" action={{ label: 'View all', href: '/therapist/calendar' }}>
      {sessions.length === 0 ? (
        <p className={styles.empty}>No completed sessions yet.</p>
      ) : (
        <ul className={styles.sessionList}>
          {sessions.map((session) => (
            <li key={session._id} className={styles.completedRow}>
              <span className={styles.avatar} aria-hidden="true">
                {(session.client?.name ?? 'C').charAt(0).toUpperCase()}
              </span>
              <span className={styles.sessionBody}>
                <span className={styles.sessionName}>{session.client?.name ?? 'Client'}</span>
                <span className={styles.sessionTime}>
                  {formatIstTimeRange(session.startAt, session.endAt)} · {session.durationLabel}
                </span>
              </span>
              <span className={styles.completedBadge}>Completed</span>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
