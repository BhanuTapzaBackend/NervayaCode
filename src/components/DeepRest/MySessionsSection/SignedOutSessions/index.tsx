'use client';

import React from 'react';
import Button from '@/components/common/Button';
import { ROUTES } from '@/utils/routesConstants';
import styles from '../EmptySessions/EmptySessions.module.css';

const LOGIN_HREF = `${ROUTES.LOGIN}?returnUrl=${encodeURIComponent('/deep-rest')}`;

export const SignedOutSessions: React.FC = () => {
  return (
    <div className={styles.noSessionsMessage}>
      <h3 className={styles.noSessionsTitle}>Sign in to view your sessions</h3>
      <p className={styles.noSessionsText}>
        Log in to access your personalized Deep Rest playlists. New here? Create an account to start your journey to
        better sleep.
      </p>
      <Button href={LOGIN_HREF} variant="primary" size="md" fullWidth={false}>
        Log in / Sign up
      </Button>
    </div>
  );
};
