import React, { useRef } from 'react';
import { Icon } from '@iconify/react';
import { ICON_X, ICON_LOADING } from '@/constants/icons';
import { Session } from '@/types/session.types';
import { Therapist } from '@/types/therapist.types';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import styles from './styles.module.css';

const ICON_GLOBE = 'solar:global-bold';
const ICON_VIDEO = 'solar:video-library-bold';

interface SessionDetailModalProps {
  session: Session;
  onClose: () => void;
  onCancel?: (session: Session) => void;
  onJoin?: (session: Session) => void;
  calculateDuration: (startTime: string, endTime: string) => string;
  isCancelling?: boolean;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  onClose,
  onCancel,
  onJoin,
  calculateDuration,
  isCancelling = false,
}) => {
  const therapist = session.therapistId as unknown as Therapist;
  const modalRef = useRef<HTMLDivElement>(null);
  useModalDismiss(true, modalRef, onClose);

  const handleJoin = () => {
    if (onJoin) {
      onJoin(session);
    } else if (session.meetLink) {
      window.open(session.meetLink, '_blank');
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div ref={modalRef} className={styles.modalContent} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Session Details</h3>
          <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Close session details">
            <Icon icon={ICON_X} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalTherapistBlock}>
            <div className={styles.modalImageWrap}>
              <div className={styles.cardImagePlaceholder}>
                {therapist?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={therapist.image}
                    alt={therapist.name}
                    className={styles.therapistImage}
                    style={{ borderRadius: '12px' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%' }} />
                )}
              </div>
            </div>
            <div className={styles.modalTherapistInfo}>
              <h4 className={styles.modalTherapistName}>{therapist?.name || 'Unknown Therapist'}</h4>
              <p className={styles.modalTherapistQualifications}>
                {therapist?.qualifications?.join(', ') || 'General Consultation'}
              </p>
            </div>
            <div className={styles.modalStatusWrap}>
              <span
                className={`${styles.statusBadge} ${styles[`status${session.status.charAt(0).toUpperCase()}${session.status.slice(1)}`]}`}
              >
                {session.status}
              </span>
            </div>
          </div>

          <div className={styles.orderSummary}>
            <div className={styles.orderHeaderSection}>
              <div className={styles.orderHeaderGroup}>
                <span className={styles.orderHeaderLabel}>Booking ID</span>
                <span className={styles.orderHeaderValue}>TH-{session._id.slice(-8).toUpperCase()}</span>
              </div>
              <div className={styles.orderHeaderGroup}>
                <span className={styles.orderHeaderLabel}>Booking Date</span>
                <span className={styles.orderHeaderValue}>
                  {new Date(session.createdAt || session.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className={styles.orderSection}>
              <h3 className={styles.sectionTitleModal}>
                <Icon icon={ICON_GLOBE} className={styles.sectionIcon} aria-hidden />
                Appointment Details
              </h3>
              <div className={styles.appointmentDetailsGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Date</span>
                  <span className={styles.detailValue}>
                    {new Date(session.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Time</span>
                  <span className={styles.detailValue}>
                    {session.startTime} - {session.endTime}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Duration</span>
                  <span className={styles.detailValue}>{calculateDuration(session.startTime, session.endTime)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Mode</span>
                  <span className={styles.detailValue}>Video Consultation</span>
                </div>
                {therapist?.sessionFee !== undefined && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Amount</span>
                    <span className={styles.detailValue}>₹{therapist.sessionFee.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalActionGroup}>
              {session.status === 'pending' || session.status === 'confirmed' ? (
                <>
                  <button
                    className={styles.primaryActionBtnFull}
                    disabled={!session.meetLink || isCancelling}
                    onClick={handleJoin}
                  >
                    <Icon icon={ICON_VIDEO} className={styles.btnIcon} />
                    {!session.meetLink ? 'Meet Link Generating...' : 'Join Session'}
                  </button>
                  <button
                    className={styles.dangerActionBtnOutline}
                    disabled={isCancelling}
                    onClick={() => onCancel?.(session)}
                  >
                    {isCancelling ? (
                      <Icon icon={ICON_LOADING} className={styles.btnIcon} />
                    ) : (
                      <Icon icon={ICON_X} className={styles.btnIcon} />
                    )}
                    {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal;
