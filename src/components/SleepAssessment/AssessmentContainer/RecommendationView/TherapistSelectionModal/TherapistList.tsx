'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_CHECK } from '@/constants/icons';
import { formatCurrency } from '@/utils/currencyConstants';
import type { Therapist } from '@/types/therapist.types';
import { getGenderAvatar, hasUsableImage } from '@/utils/therapistAvatar';
import styles from './styles.module.css';

interface TherapistListProps {
  therapists: Therapist[];
  fallbackPrice: number;
  selectedId: string | null;
  onPick: (t: Therapist) => void;
}

const avatarVariantClass: Record<string, string> = {
  male: styles.avatarVariantMale,
  female: styles.avatarVariantFemale,
  neutral: styles.avatarVariantNeutral,
};

/**
 * Every available therapist, as a single-select list.
 *
 * This used to be a secondary "view other therapists" screen behind an
 * algorithmically recommended one. Picking here no longer navigates: the slot
 * panel beside it reloads for whoever is selected.
 */
export function TherapistList({ therapists, fallbackPrice, selectedId, onPick }: Readonly<TherapistListProps>) {
  return (
    <ul className={styles.therapistList} role="radiogroup" aria-label="Available therapists">
      {therapists.map((t) => {
        const avatar = getGenderAvatar(t.gender);
        const hasImage = hasUsableImage(t.image);
        const isSelected = t._id === selectedId;
        return (
          <li key={t._id}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`${styles.therapistCard}${isSelected ? ` ${styles.therapistCardSelected}` : ''}`}
              onClick={() => onPick(t)}
            >
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
              {/* Colour alone did not distinguish the chosen therapist from the
                  one merely under the cursor — both read as "selected". */}
              {isSelected && <Icon icon={ICON_CHECK} className={styles.tSelectedMark} aria-hidden />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
