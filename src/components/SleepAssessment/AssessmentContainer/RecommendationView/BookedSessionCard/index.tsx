'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ICON_CALENDAR_LUCIDE, ICON_VIDEO, ICON_CHECK } from '@/constants/icons';
import type { Session } from '@/types/session.types';
import type { Therapist } from '@/types/therapist.types';
import styles from './styles.module.css';

export interface BookedSessionCardProps {
  session: Session;
}

function therapistName(session: Session): string {
  if (session.therapist?.name) return session.therapist.name;
  const ref = session.therapistId as string | Therapist;
  return typeof ref === 'object' && ref?.name ? ref.name : 'your therapist';
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Replaces the "Choose a Therapist" CTA once the plan's session exists, so
 * returning to the recommendation reflects what was actually booked instead of
 * asking again.
 */
export function BookedSessionCard({ session }: Readonly<BookedSessionCardProps>) {
  return (
    <section className={styles.card} aria-label="Your booked therapy session">
      <p className={styles.eyebrow}>
        <Icon icon={ICON_CHECK} className={styles.tick} aria-hidden="true" />
        Session booked
      </p>

      <h3 className={styles.title}>Your session with {therapistName(session)}</h3>

      <p className={styles.when}>
        <Icon icon={ICON_CALENDAR_LUCIDE} aria-hidden="true" />
        {formatDate(session.date)} at {session.startTime}
      </p>

      <div className={styles.actions}>
        {session.meetLink && (
          <Link href={session.meetLink} className={styles.joinBtn}>
            <Icon icon={ICON_VIDEO} aria-hidden="true" />
            Join your session
          </Link>
        )}
        <Link href="/dashboard" className={styles.secondaryLink}>
          View all sessions
        </Link>
      </div>
    </section>
  );
}

export default BookedSessionCard;
