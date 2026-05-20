'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_CART, ICON_CALENDAR, ICON_STAR } from '@/constants/icons';
import { formatCurrency } from '@/utils/currencyConstants';
import type { Therapist } from '@/types/therapist.types';
import type { TherapyAction } from './useTherapistSelection';
import { getGenderAvatar, hasUsableImage } from '@/utils/therapistAvatar';
import styles from './styles.module.css';

interface RecommendedTherapistCardProps {
  therapist: Therapist;
  fallbackPrice: number;
  hasOtherTherapists: boolean;
  onStartBooking: (action: TherapyAction) => void;
  onViewOthers: () => void;
}

const avatarVariantClass: Record<string, string> = {
  male: styles.avatarVariantMale,
  female: styles.avatarVariantFemale,
  neutral: styles.avatarVariantNeutral,
};

export function RecommendedTherapistCard({
  therapist,
  fallbackPrice,
  hasOtherTherapists,
  onStartBooking,
  onViewOthers,
}: Readonly<RecommendedTherapistCardProps>) {
  const avatar = getGenderAvatar(therapist.gender);
  const hasImage = hasUsableImage(therapist.image);
  const fee = formatCurrency(therapist.sessionFee ?? fallbackPrice);
  const blurb = therapist.quote || therapist.bio || therapist.messageToClient;

  return (
    <div className={styles.recCard}>
      <div className={styles.recBadge}>
        <Icon icon={ICON_STAR} aria-hidden /> Recommended for you
      </div>

      <div className={styles.recHero}>
        <div className={`${styles.recAvatarWrap}${hasImage ? '' : ` ${avatarVariantClass[avatar.variant]}`}`}>
          {hasImage ? (
            <Image src={therapist.image as string} alt={therapist.name} fill sizes="96px" className={styles.avatar} />
          ) : (
            <Icon icon={avatar.icon} className={styles.recAvatarIcon} aria-hidden />
          )}
        </div>
        <div className={styles.recHeadInfo}>
          <p className={styles.recName}>{therapist.name}</p>
          <p className={styles.recMeta}>
            {therapist.specializations?.[0] ?? 'General Therapy'}
            {therapist.experience ? ` • ${therapist.experience}y experience` : ''}
          </p>
          <p className={styles.recFee}>
            {fee} <span className={styles.recFeeUnit}>/ session</span>
          </p>
        </div>
      </div>

      {blurb && <p className={styles.recBlurb}>“{blurb}”</p>}

      <div className={styles.recActions}>
        <button type="button" className={styles.recBookBtn} onClick={() => onStartBooking('book')}>
          <Icon icon={ICON_CALENDAR} aria-hidden /> Book Now
        </button>
        <button type="button" className={styles.recCartBtn} onClick={() => onStartBooking('cart')}>
          <Icon icon={ICON_CART} aria-hidden /> Add to Cart
        </button>
      </div>

      {hasOtherTherapists && (
        <button type="button" className={styles.recViewOthers} onClick={onViewOthers}>
          View other therapists
        </button>
      )}
    </div>
  );
}
