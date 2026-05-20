import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_PLAY, ICON_VIDEO_CAMERA, ICON_TRANSLATE } from '@/constants/icons';
import { Therapist } from '@/types/therapist.types';
import { Badge } from '@/components/common';
import { TherapistAvatar } from '@/components/common/TherapistAvatar';
import { hasUsableImage } from '@/utils/therapistAvatar';
import { SpecializationMarquee } from './SpecializationMarquee';
import styles from '../styles.module.css';

interface TherapistCardProps {
  therapist: Therapist;
  onViewProfile: (therapist: Therapist) => void;
  onBookAppointment: (therapist: Therapist) => void;
  onVideoPreview: (therapist: Therapist) => void;
  formatExperienceYears: (exp?: string) => string;
  nextSlotLabel?: string | null;
  isNextSlotLoading: boolean;
}

export function TherapistCard({
  therapist,
  onViewProfile,
  onBookAppointment,
  onVideoPreview,
  formatExperienceYears,
  nextSlotLabel,
  isNextSlotLoading,
}: TherapistCardProps) {
  const nextSlotPrefix = 'Next online slot:';
  const nextSlotText = isNextSlotLoading ? 'Checking availability...' : nextSlotLabel || 'No upcoming online slot';

  return (
    <li className={styles.therapistCard}>
      <div className={styles.cardBody}>
        <div className={styles.therapistInfo}>
          <div className={styles.mediaCard}>
            {therapist.introVideoUrl ? (
              <button
                type="button"
                className={styles.videoPreviewButton}
                onClick={() => onVideoPreview(therapist)}
                aria-label={`Play intro video for ${therapist.name}`}
              >
                {therapist.introVideoThumbnail || therapist.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={therapist.introVideoThumbnail || therapist.image}
                    alt={`${therapist.name} video preview`}
                    className={styles.mediaImage}
                  />
                ) : (
                  <div className={styles.videoFallback}>
                    <Icon icon={ICON_VIDEO_CAMERA} width={32} />
                    <span>Intro Video</span>
                  </div>
                )}
                <span className={styles.videoOverlay}>
                  <Icon icon={ICON_PLAY} width={14} height={14} />
                  Watch intro
                </span>
              </button>
            ) : hasUsableImage(therapist.image) ? (
              <Image
                src={therapist.image as string}
                alt={therapist.name}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className={styles.mediaImage}
              />
            ) : (
              <TherapistAvatar gender={therapist.gender} name={therapist.name} />
            )}
          </div>

          <div className={styles.therapistText}>
            <div className={styles.titleRow}>
              <h3>{therapist.name}</h3>
            </div>
            <p className={styles.credentials}>
              {formatExperienceYears(therapist.experience != null ? String(therapist.experience) : undefined)}
            </p>
            <div className={styles.metaInfoRow}>
              {therapist.sessionFee != null && therapist.sessionDurationMins != null ? (
                <Badge variant="purple" size="sm" className={styles.feeText}>
                  ₹{therapist.sessionFee} for {therapist.sessionDurationMins} min
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className={styles.cardMeta}>
          <div className={styles.expertiseRow}>
            <span className={styles.expertiseLabel}>Qualification :</span>
            <span className={styles.qualificationText}>
              {therapist.qualifications?.length ? therapist.qualifications.join(', ') : '—'}
            </span>
          </div>
          <div className={styles.expertiseRow}>
            <span className={styles.expertiseLabel}>Specialization :</span>
            <div className={styles.tags}>
              <SpecializationMarquee items={therapist.specializations || []} />
            </div>
          </div>
          <p className={styles.speaksLine}>
            <Icon icon={ICON_TRANSLATE} />
            <span>{therapist.languages?.join(', ') || 'English'}</span>
          </p>
        </div>

        <div className={styles.availabilitySection}>
          <p className={styles.nextSlotLine}>
            <span className={styles.statusDot} />
            {nextSlotPrefix}{' '}
            <span className={nextSlotLabel ? styles.nextSlotValue : styles.nextSlotFallback}>{nextSlotText}</span>
          </p>
        </div>

        <div className={styles.actions}>
          <Link
            href={`/therapy-corner/${therapist._id}`}
            className={styles.secondaryBtn}
            onClick={() => onViewProfile(therapist)}
          >
            View Profile
          </Link>
          <button className={styles.primaryBtn} onClick={() => onBookAppointment(therapist)}>
            Book Now
          </button>
        </div>
      </div>
    </li>
  );
}
