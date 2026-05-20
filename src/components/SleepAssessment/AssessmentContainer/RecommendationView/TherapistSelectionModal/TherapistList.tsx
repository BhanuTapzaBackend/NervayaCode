'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/utils/currencyConstants';
import type { Therapist } from '@/types/therapist.types';
import { getGenderAvatar, hasUsableImage } from '@/utils/therapistAvatar';
import styles from './styles.module.css';

interface TherapistListProps {
  therapists: Therapist[];
  fallbackPrice: number;
  onPick: (t: Therapist) => void;
}

const avatarVariantClass: Record<string, string> = {
  male: styles.avatarVariantMale,
  female: styles.avatarVariantFemale,
  neutral: styles.avatarVariantNeutral,
};

export function TherapistList({ therapists, fallbackPrice, onPick }: Readonly<TherapistListProps>) {
  return (
    <ul className={styles.therapistList}>
      {therapists.map((t) => {
        const avatar = getGenderAvatar(t.gender);
        const hasImage = hasUsableImage(t.image);
        return (
          <li key={t._id}>
            <button type="button" className={styles.therapistCard} onClick={() => onPick(t)}>
              <div className={`${styles.avatarWrap}${hasImage ? '' : ` ${avatarVariantClass[avatar.variant]}`}`}>
                {hasImage ? (
                  <Image src={t.image as string} alt={t.name} fill sizes="56px" className={styles.avatar} />
                ) : (
                  <Icon icon={avatar.icon} className={styles.avatarIcon} aria-hidden />
                )}
              </div>
              <div className={styles.tInfo}>
                <p className={styles.tName}>{t.name}</p>
                <p className={styles.tMeta}>
                  {t.specializations?.[0] ?? 'General Therapy'}
                  {t.experience ? ` • ${t.experience}y exp` : ''}
                </p>
              </div>
              <span className={styles.tFee}>{formatCurrency(t.sessionFee ?? fallbackPrice)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
