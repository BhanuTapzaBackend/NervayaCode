'use client';

import Link from 'next/link';
import React from 'react';
import { Icon } from '@iconify/react';
import { ICON_CHAT, ICON_USER, ICON_CLIPBOARD } from '@/constants/icons';
import styles from './QuickActions.module.css';

export function QuickActions() {
  return (
    <section className={styles.wrap} aria-label="Quick actions">
      <h2 className={styles.title}>Quick actions</h2>
      <div className={styles.grid}>
        <Link className={styles.action} href="/therapy-corner">
          <Icon icon={ICON_CHAT} width={20} height={20} aria-hidden />
          Book a therapist
        </Link>
        <Link className={styles.action} href="/sleep-supplements">
          <Icon icon={ICON_USER} width={20} height={20} aria-hidden />
          Browse supplements
        </Link>
        <Link className={styles.action} href="/sleep-assessment" prefetch={true}>
          <Icon icon={ICON_CLIPBOARD} width={20} height={20} aria-hidden />
          Take sleep assessment
        </Link>
      </div>
    </section>
  );
}
