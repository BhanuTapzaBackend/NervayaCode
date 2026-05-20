'use client';

import React from 'react';
import styles from './styles.module.css';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}

export default function StatsCard({ title, value, subtitle, icon, trend, trendLabel }: StatsCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        {icon && <div className={styles.iconWrapper}>{icon}</div>}
        <h3 className={styles.cardTitle}>{title}</h3>
      </div>
      <p className={styles.cardValue}>{value}</p>
      {subtitle && <p className={styles.cardHint}>{subtitle}</p>}
      {trend !== undefined && trendLabel && (
        <p className={`${styles.trend} ${styles[`trend${trend.charAt(0).toUpperCase()}${trend.slice(1)}`]}`}>
          {trendLabel}
        </p>
      )}
    </div>
  );
}
