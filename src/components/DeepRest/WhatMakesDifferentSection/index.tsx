'use client';

import { Icon } from '@iconify/react';
import {
  ICON_BRAIN,
  ICON_CLOCK,
  ICON_CHART,
  ICON_USER_SETTINGS,
  ICON_SHIELD,
  ICON_USER_MEDICAL,
} from '@/constants/icons';
import styles from './styles.module.css';

const LEFT_FEATURES = [
  { text: 'Scientifically-backed audio techniques', icon: ICON_BRAIN },
  { text: 'Available anytime, anywhere', icon: ICON_CLOCK },
  { text: 'Progressive improvement over time', icon: ICON_CHART },
];

const RIGHT_FEATURES = [
  { text: 'Customized to your sleep patterns', icon: ICON_USER_SETTINGS },
  { text: 'No medication or side effects', icon: ICON_SHIELD },
  { text: 'Expert support included', icon: ICON_USER_MEDICAL },
];

const WhatMakesDifferentSection = () => {
  return (
    <div className={styles.whatAreCard}>
      <p className={`${styles.whatAreText} ${styles.whatMakesIntro}`}>
        Every session is built around your goals and preferences. We combine evidence-based methods with one-on-one
        input so you get a rest experience that fits you—not a one-size-fits-all track.
      </p>
      <div className={styles.whatMakesGrid}>
        <ul className={styles.whatMakesList} aria-label="Session features">
          {LEFT_FEATURES.map((feature) => (
            <li key={feature.text} className={styles.whatMakesItem}>
              <div className={styles.whatMakesIcon} aria-hidden>
                <Icon icon={feature.icon} width={12} height={12} />
              </div>
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
        <ul className={styles.whatMakesList} aria-label="Session benefits">
          {RIGHT_FEATURES.map((feature) => (
            <li key={feature.text} className={styles.whatMakesItem}>
              <div className={styles.whatMakesIcon} aria-hidden>
                <Icon icon={feature.icon} width={12} height={12} />
              </div>
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WhatMakesDifferentSection;
