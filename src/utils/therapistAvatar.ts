import { GENDER, type Gender } from '@/lib/constants/enums';
import { ICON_USER } from '@/constants/icons';

export type AvatarVariant = 'male' | 'female' | 'neutral';

export interface GenderAvatar {
  icon: string;
  variant: AvatarVariant;
}

/**
 * Picks a generic gender-based avatar (icon + colour variant) used when a
 * therapist has no uploaded photo. Real photos still render normally.
 */
export function getGenderAvatar(gender?: Gender): GenderAvatar {
  if (gender === GENDER.MALE) return { icon: 'mdi:face-man', variant: 'male' };
  if (gender === GENDER.FEMALE) return { icon: 'mdi:face-woman', variant: 'female' };
  return { icon: ICON_USER, variant: 'neutral' };
}

/**
 * True only when the therapist has a real image URL. The gender placeholder
 * (and its colour tint) must show ONLY when this is false.
 */
export function hasUsableImage(image?: string | null): boolean {
  return typeof image === 'string' && image.trim().length > 0;
}
