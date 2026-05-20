import { IMAGES } from './imageConstants';

export interface LandingPageCard {
  id: number;
  image: string;
  title: string;
  description: string;
  primaryCta: {
    text: string;
    href: string;
  };
  secondaryCta: {
    text: string;
    href: string;
  };
}

export const landingPageCardsData: LandingPageCard[] = [
  {
    id: 1,
    image: IMAGES.CARD_THERAPY_SESSION,
    title: 'Therapy',
    description:
      'Trouble unwinding at night? Our expert therapists gently help you release anxiety & stress, restore your natural sleep rhythm, and wake up feeling lighter and more refreshed all day.',
    primaryCta: {
      text: 'Book Session',
      href: '/therapy-corner',
    },
    secondaryCta: {
      text: 'Add to Cart',
      href: '/therapy-corner',
    },
  },
  {
    id: 2,
    image: IMAGES.CARD_DRIFT_OFF,
    title: 'Deep Rest',
    description:
      "Tailor-made sessions crafted just for you by blending guided hypnosis & meditation to help you release the day's burdens and drift into a quieter, more peaceful dimension. Wake up rejuvenated every morning.",
    primaryCta: {
      text: 'Buy Audio',
      href: '/deep-rest',
    },
    secondaryCta: {
      text: 'Add to Cart',
      href: '/deep-rest',
    },
  },
  {
    id: 3,
    image: IMAGES.CARD_SLEEP_SUPPLEMENTS,
    title: 'Sleep Essentials',
    description:
      'Our non-habit forming, fully herbal and no-melatonin formula helps you unwind naturally and drift into deep, restorative sleep. Wake up refreshed, never dependent.',
    primaryCta: {
      text: 'Buy Now',
      href: '/sleep-supplements',
    },
    secondaryCta: {
      text: 'Add to Cart',
      href: '/sleep-supplements',
    },
  },
];
