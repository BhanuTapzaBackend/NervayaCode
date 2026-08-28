'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/utils/currencyConstants';
import { getGenderAvatar, hasUsableImage } from '@/utils/therapistAvatar';
import type { Therapist } from '@/types/therapist.types';
import styles from './styles.module.css';

interface SelectedTherapistBarProps {
  therapist: Therapist;
  fallbackPrice: number;
  onChange: () => void;
}

/**
 * The chosen therapist, condensed, with a way back to the list.
 *
 * Mobile only. Stacked full-width, the five therapist cards ran to roughly
 * 440px — so after choosing one you still had to scroll past all of them to
 * reach the calendar, and past that again to reach the slots. Collapsing the
 * list to this row once a choice is made puts the date and times on the first
 * screen instead.
 */
export function SelectedTherapistBar({ therapist, fallbackPrice, onChange }: Readonly<SelectedTherapistBarProps>) {
  const avatar = getGenderAvatar(therapist.gender);
  const hasImage = hasUsableImage(therapist.image);

  return (
    <div className={styles.chosenBar}>
      <div className={`${styles.chosenAvatar}${hasImage ? '' : ` ${styles.avatarVariantNeutral}`}`}>
        {hasImage ? (
          <Image src={therapist.image as string} alt="" fill sizes="40px" className={styles.avatar} />
        ) : (
          <Icon icon={avatar.icon} className={styles.avatarIcon} aria-hidden />
        )}
      </div>

      <div className={styles.chosenInfo}>
        <p className={styles.chosenName}>{therapist.name}</p>
        <p className={styles.chosenMeta}>
          {therapist.specializations?.[0] ?? 'General Therapy'} •{' '}
          {formatCurrency(therapist.sessionFee ?? fallbackPrice)}
        </p>
      </div>

      <button type="button" className={styles.chosenChange} onClick={onChange}>
        Change
      </button>
    </div>
  );
}
