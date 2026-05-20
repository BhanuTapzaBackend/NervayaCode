import { Icon } from '@iconify/react';
import type { Gender } from '@/lib/constants/enums';
import { getGenderAvatar } from '@/utils/therapistAvatar';
import styles from './styles.module.css';

interface TherapistAvatarProps {
  gender?: Gender;
  name?: string;
  className?: string;
}

const variantClass: Record<string, string> = {
  male: styles.male,
  female: styles.female,
  neutral: styles.neutral,
};

/**
 * Generic gender-based placeholder shown when a therapist has no photo —
 * matches the recommendation flow's avatar. Fills its parent container.
 */
export function TherapistAvatar({ gender, name, className }: Readonly<TherapistAvatarProps>) {
  const avatar = getGenderAvatar(gender);
  return (
    <div
      className={`${styles.placeholder} ${variantClass[avatar.variant]} ${className ?? ''}`}
      role="img"
      aria-label={name ? `${name} (no photo available)` : 'No photo available'}
    >
      <Icon icon={avatar.icon} className={styles.icon} aria-hidden />
    </div>
  );
}

export default TherapistAvatar;
