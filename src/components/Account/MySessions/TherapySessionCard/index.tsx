import React from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_CALENDAR, ICON_USER, ICON_HASHTAG, ICON_CHEVRON_RIGHT } from '@/constants/icons';
import { Session } from '@/types/session.types';
import { Therapist } from '@/types/therapist.types';
import { Badge } from '@/components/common';
import styles from './styles.module.css';

interface TherapySessionCardProps {
  session: Session;
  onViewDetails: (session: Session) => void;
  onReschedule?: (session: Session) => void;
}

function getStatusLabel(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'pending' || s === 'confirmed') return 'Upcoming';
  if (s === 'completed') return 'Completed';
  if (s === 'cancelled') return 'Cancelled';
  return status || 'Upcoming';
}

const TherapySessionCard: React.FC<TherapySessionCardProps> = ({ session, onViewDetails, onReschedule }) => {
  const therapist = session.therapistId as unknown as Therapist;
  const statusLabel = getStatusLabel(session.status || '');
  const canReschedule = ['pending', 'confirmed'].includes((session.status || '').toLowerCase());

  return (
    <div className={styles.sessionCard}>
      <Badge
        variant={statusLabel === 'Upcoming' ? 'info' : statusLabel === 'Completed' ? 'success' : 'error'}
        className={styles.statusTag}
      >
        {statusLabel}
      </Badge>
      <div className={styles.cardImagePlaceholder}>
        {therapist?.image ? (
          <Image
            src={therapist.image}
            alt={therapist.name}
            fill
            sizes="(max-width: 768px) 100vw, 140px"
            className={styles.therapistImage}
          />
        ) : null}
      </div>

      <div className={styles.cardContent}>
        <h4 className={styles.itemTitle}>{therapist?.name || 'Unknown Therapist'}</h4>
        <p className={styles.itemSubtitle}>Sleep Consultation</p>
        <p className={styles.itemDescription}>
          One-on-one consultation to discuss sleep patterns and develop a custom treatment plan
        </p>

        <div className={styles.infoChips}>
          <div className={styles.chip}>
            <div className={styles.chipIconWrap}>
              <Icon icon={ICON_CALENDAR} />
            </div>
            <div className={styles.chipText}>
              <span className={styles.chipLabel}>Booking Date</span>
              <span className={styles.chipValue}>
                {new Date(session.createdAt || session.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className={styles.chip}>
            <div className={styles.chipIconWrap}>
              <Icon icon={ICON_HASHTAG} />
            </div>
            <div className={styles.chipText}>
              <span className={styles.chipLabel}>Booking ID</span>
              <span className={styles.chipValue}>TH-{session._id.slice(-8).toUpperCase()}</span>
            </div>
          </div>

          <div className={styles.chip}>
            <div className={styles.chipIconWrap}>
              <Icon icon={ICON_USER} />
            </div>
            <div className={styles.chipText}>
              <span className={styles.chipLabel}>Appointment Date</span>
              <span className={styles.chipValue}>
                {new Date(session.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                • {session.startTime}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.cardActionsRow}>
          <button className={styles.primaryActionBtn} onClick={() => onViewDetails(session)}>
            <Icon icon={ICON_CALENDAR} className={styles.btnIcon} /> View Session Details
          </button>
          {canReschedule && (
            <button className={styles.secondaryActionBtn} onClick={() => onReschedule?.(session)}>
              Reschedule Appointment <Icon icon={ICON_CHEVRON_RIGHT} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapySessionCard;
