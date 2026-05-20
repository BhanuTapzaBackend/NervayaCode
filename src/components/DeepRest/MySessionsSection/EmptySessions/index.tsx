'use client';

import React from 'react';
import Button from '@/components/common/Button';
import styles from './EmptySessions.module.css';

export const EmptySessions: React.FC = () => {
  return (
    <div className={styles.noSessionsMessage}>
      <h3 className={styles.noSessionsTitle}>Start Your Journey</h3>
      <p className={styles.noSessionsText}>
        Experience a personalized Deep Rest session designed just for you. Once you purchase a session, it will appear
        here.
      </p>
      <Button href="/deep-rest/payment" variant="primary" size="md" fullWidth={false}>
        Buy Your First Session
      </Button>
    </div>
  );
};
