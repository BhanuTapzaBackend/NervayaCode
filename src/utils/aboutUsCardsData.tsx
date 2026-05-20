import { ICON_HEART_PULSE, ICON_SHIELD, ICON_USERS_GROUP } from '@/constants/icons';

export interface AboutUsCard {
  id: number;
  icon: string;
  title: string;
  description: string;
}

export const aboutUsCardsData: AboutUsCard[] = [
  {
    id: 1,
    icon: ICON_HEART_PULSE,
    title: 'Uncompromising Quality',
    description:
      'Each offering reflects our intention to bring our best forward through thoughtful, well-crafted products.',
  },
  {
    id: 2,
    icon: ICON_SHIELD,
    title: 'Expert Therapists',
    description: 'Our team of licensed professionals brings years of experience in various therapeutic approaches.',
  },
  {
    id: 3,
    icon: ICON_USERS_GROUP,
    title: 'Personalized Support',
    description: 'Every person is unique, and we tailor our approach to meet your individual needs and goals.',
  },
];
