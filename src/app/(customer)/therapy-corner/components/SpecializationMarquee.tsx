import React from 'react';
import styles from '../styles.module.css';

interface SpecializationMarqueeProps {
  items: string[];
}

export function SpecializationMarquee({ items }: SpecializationMarqueeProps) {
  const uniqueItems = Array.from(new Set(items));

  if (uniqueItems.length === 0) {
    return <span className={styles.emptyTag}>General Therapy</span>;
  }

  const shouldScroll = uniqueItems.length > 1;

  if (!shouldScroll) {
    return (
      <div className={styles.tagsStatic}>
        <span className={styles.tag}>{uniqueItems[0]}</span>
      </div>
    );
  }

  return (
    <div className={styles.marqueeViewport} aria-label="Specializations">
      <div className={styles.marqueeTrack}>
        <div className={styles.marqueeGroup}>
          {uniqueItems.map((spec) => (
            <span key={`group-a-${spec}`} className={styles.tag} title={spec}>
              {spec}
            </span>
          ))}
        </div>
        <div className={styles.marqueeGroup} aria-hidden="true">
          {uniqueItems.map((spec) => (
            <span key={`group-b-${spec}`} className={styles.tag} title={spec}>
              {spec}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
