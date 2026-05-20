'use client';

import React from 'react';
import { getHourLabels, HOUR_HEIGHT } from '../utils/calendarHelpers';
import styles from './styles.module.css';

export const TimeGrid: React.FC = () => {
  // We skip the first hour (7 AM) in the label generation, so we offset the rendering
  const hours = getHourLabels();

  return (
    <div className={styles.gutter}>
      <div className={styles.gutterHeader} />
      {/* Spacer for the first hour (7 AM) which has no label */}
      <div style={{ height: HOUR_HEIGHT }} />
      {hours.map((label) => (
        <div key={label} className={styles.hourRow} style={{ height: HOUR_HEIGHT }}>
          <span className={styles.hourLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
};
