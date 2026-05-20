import React, { useRef } from 'react';
import { Icon } from '@iconify/react';
import { ICON_X } from '@/constants/icons';
import { Therapist } from '@/types/therapist.types';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import styles from '../styles.module.css';
import { getEmbedUrl } from '@/lib/utils/video.utils';

interface VideoPreviewModalProps {
  therapist: Therapist | null;
  onClose: () => void;
}

export function VideoPreviewModal({ therapist, onClose }: VideoPreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalDismiss(!!therapist?.introVideoUrl, modalRef, onClose);

  if (!therapist?.introVideoUrl) return null;

  const embedUrl = getEmbedUrl(therapist.introVideoUrl);

  return (
    <div className={styles.modalOverlay}>
      <div ref={modalRef} className={styles.videoModal} key={therapist._id} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <h3>{therapist.name} - Intro Video</h3>
          <button type="button" className={styles.closeModalBtn} onClick={onClose} aria-label="Close video">
            <Icon icon={ICON_X} width={18} height={18} />
          </button>
        </div>
        {embedUrl ? (
          <iframe
            className={styles.videoPlayer}
            src={embedUrl}
            title={`${therapist.name} - Intro Video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            className={styles.videoPlayer}
            controls
            autoPlay
            poster={therapist.introVideoThumbnail || therapist.image || ''}
            src={therapist.introVideoUrl}
          >
            <source src={therapist.introVideoUrl} />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  );
}
