'use client';

import { Icon } from '@iconify/react';
import { ICON_HEADPHONES } from '@/constants/icons';
import Button from '@/components/common/Button';
import styles from './styles.module.css';

const WhatAreSection = () => {
  return (
    <div className={styles.whatAreCard}>
      <div className={styles.whatAreIcon} aria-hidden>
        <Icon icon={ICON_HEADPHONES} />
      </div>
      <div className={styles.whatAreContent}>
        <p className={styles.whatAreText}>
          Deep Rest Sessions are 25-minute personalized audio experiences designed for anyone who struggles to unwind or
          fall asleep. They blend gentle hypnotic guidance with neuroplasticity-backed techniques to help your mind and
          body transition into deep, restorative rest.
        </p>
      </div>
      <div className={styles.whatAreAction}>
        <Button href="/deep-rest/payment" variant="primary" size="md" fullWidth={false}>
          Buy Session
        </Button>
      </div>
    </div>
  );
};

export default WhatAreSection;
