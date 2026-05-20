'use client';

import React from 'react';
import Link from 'next/link';
import styles from './styles.module.css';

interface SessionRow {
  _id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: string;
  therapistId?: { name?: string } | string;
}

export interface UpcomingSessionsProps {
  sessions: SessionRow[];
  emptyMessage?: string;
}

export default function UpcomingSessions({ sessions, emptyMessage = 'No upcoming sessions.' }: UpcomingSessionsProps) {
  if (!sessions?.length) {
    return (
      <div className={styles.empty} role="status">
        {emptyMessage}
      </div>
    );
  }
  return (
    <ul className={styles.list} aria-label="Upcoming sessions">
      {sessions.map((session) => {
        const therapist = session.therapistId;
        const name = typeof therapist === 'object' && therapist && 'name' in therapist ? therapist.name : '—';
        const formattedDate = new Date(session.date).toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        return (
          <li key={session._id} className={styles.item}>
            <div className={styles.main}>
              <div className={styles.sessionMeta}>
                <span className={styles.date}>{formattedDate}</span>
                <span className={styles.time}>
                  {session.startTime}
                  {session.endTime ? ` - ${session.endTime}` : ''}
                </span>
              </div>
              <div className={styles.sessionInfo}>
                <span className={styles.therapist}>{name}</span>
                <span className={styles.badge}>{session.status}</span>
              </div>
            </div>
          </li>
        );
      })}
      <li className={styles.footer}>
        <Link href="/admin/sessions" className={styles.link}>
          View all sessions
        </Link>
      </li>
    </ul>
  );
}
