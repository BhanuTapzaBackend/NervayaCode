'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';
import { IDriftOffResponse } from '@/types/driftOff.types';
import { ICON_HEADPHONES, ICON_CLOCK, ICON_PLAY, ICON_INFO } from '@/constants/icons';
import type { VideoPlayerProps } from '@/components/DeepRest/VideoPlayer';
import { Badge } from '@/components/common';
import Button from '@/components/common/Button';
import { ReviewForm } from '@/components/DeepRest/ReviewForm';
import styles from './SessionCard.module.css';

const VideoPlayerDynamic = dynamic(() => import('@/components/DeepRest/VideoPlayer'), {
  ssr: false,
}) as React.ComponentType<VideoPlayerProps>;

const RE_SESSION_INFO_TEXT = 'You can request for one additional session free of charge';

interface ReRequestLinkProps {
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

const ReRequestLink: React.FC<ReRequestLinkProps> = ({
  href,
  disabled = false,
  loading = false,
  label = 'Request Re-Session',
}) => {
  const info = (
    <span className={styles.infoWrap}>
      <span
        className={styles.infoIcon}
        role="button"
        tabIndex={0}
        aria-label="Re-session info"
        aria-describedby="re-session-tip"
      >
        <Icon icon={ICON_INFO} width={14} height={14} aria-hidden />
      </span>
      <span id="re-session-tip" role="tooltip" className={styles.tooltip}>
        {RE_SESSION_INFO_TEXT}
      </span>
    </span>
  );

  if (disabled || !href) {
    return (
      <span className={`${styles.reRequestRow} ${styles.reRequestDisabled}`}>
        <span className={styles.reRequestLink} aria-disabled="true">
          {label}
        </span>
        {info}
      </span>
    );
  }

  return (
    <span className={styles.reRequestRow}>
      <Link href={href} className={styles.reRequestLink} aria-busy={loading || undefined}>
        {label}
      </Link>
      {info}
    </span>
  );
};

interface SessionCardProps {
  session: IDriftOffResponse;
  hasMounted: boolean;
  isRequesting: boolean;
  requestError?: string;
}

function isDriveUrl(url: string): boolean {
  return /drive\.google\.com/i.test(url);
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, hasMounted, isRequesting, requestError }) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const videoUrl = session.assignedVideoUrl;
  const isReady = Boolean(videoUrl);
  const isExternalLink = videoUrl ? isDriveUrl(videoUrl) : false;
  const isPendingAssessment = !session.completedAt;
  const isPreparing = session.completedAt && !session.assignedVideoUrl;
  const hasRequestedReSession = Boolean(session.reSessionRequestedAt);
  const hasPendingReSessionRequest = Boolean(session.reSessionRequestedAt && !session.reSessionResolvedAt);
  const hasResolvedReSessionRequest = Boolean(session.reSessionRequestedAt && session.reSessionResolvedAt);

  return (
    <div className={styles.sessionCard}>
      <div className={styles.cardHeader}>
        <div className={styles.dateInfo}>
          <span className={styles.dateLabel}>Purchased on</span>
          <span className={styles.dateValue}>{new Date(session.createdAt).toLocaleDateString()}</span>
        </div>
        <Badge
          variant={hasPendingReSessionRequest ? 'purple' : isReady ? 'success' : isPreparing ? 'warning' : 'error'}
        >
          {hasPendingReSessionRequest
            ? 'Re-Session Requested'
            : isReady
              ? 'Ready'
              : isPreparing
                ? 'Preparing'
                : 'Pending Action'}
        </Badge>
      </div>

      <div className={styles.cardContent}>
        {isReady && isExternalLink ? (
          <a href={videoUrl ?? ''} target="_blank" rel="noopener noreferrer" className={styles.externalSessionLink}>
            <Icon icon={ICON_PLAY} width={48} height={48} className={styles.externalSessionIcon} />
            <span className={styles.externalSessionText}>Open Your Session</span>
            <span className={styles.externalSessionHint}>Opens in a new tab</span>
          </a>
        ) : isReady ? (
          <div className={styles.videoContainer}>
            {hasMounted && (
              <VideoPlayerDynamic
                url={videoUrl ?? ''}
                width="100%"
                height="100%"
                controls
                className={styles.videoPlayer}
              />
            )}
          </div>
        ) : (
          <div className={styles.placeholderBox}>
            <Icon
              icon={isPreparing ? ICON_CLOCK : ICON_HEADPHONES}
              width={40}
              height={40}
              className={styles.placeholderIcon}
            />
            <p className={styles.placeholderText}>
              {isPreparing
                ? 'Our specialists are crafting your session...'
                : 'Complete your assessment to get started.'}
            </p>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        {isPendingAssessment && (
          <Button
            href={`/deep-rest/questionnaire?orderId=${session.driftOffOrderId}`}
            variant="primary"
            size="md"
            fullWidth
          >
            Complete Assessment
          </Button>
        )}
        {isPreparing && (
          <>
            <p className={styles.preparationNote}>Expected in 1-2 days</p>
            <ReRequestLink disabled />
          </>
        )}
        {isReady && (
          <>
            {!hasRequestedReSession && <p className={styles.readyNote}>Enjoy your personalized Deep Rest session.</p>}
            {!hasRequestedReSession ? (
              <ReRequestLink
                href={`/deep-rest/questionnaire?orderId=${session.driftOffOrderId}&mode=re-session`}
                loading={isRequesting}
              />
            ) : (
              <ReRequestLink disabled label={hasPendingReSessionRequest ? 'Re-Session Requested' : 'Re-Session Used'} />
            )}
          </>
        )}
        {isReady && hasPendingReSessionRequest && (
          <p className={styles.requestPendingNote}>
            Re-session requested on {new Date(session.reSessionRequestedAt as Date).toLocaleDateString()}. Our team will
            assign a replacement video soon.
          </p>
        )}
        {isReady && hasResolvedReSessionRequest && (
          <p className={styles.reassignedNote}>
            Your replacement session has been assigned. Re-session requests are limited to one per purchased session.
          </p>
        )}
        {requestError && <p className={styles.requestError}>{requestError}</p>}

        {isReady && (
          <Button type="button" variant="secondary" size="md" fullWidth onClick={() => setShowReviewForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {showReviewForm && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Write a review"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReviewForm(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowReviewForm(false);
          }}
        >
          <div className={styles.modalContent}>
            <ReviewForm
              responseId={session._id}
              onSuccess={() => setShowReviewForm(false)}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
