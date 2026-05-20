'use client';

import styles from './styles.module.css';
import { aboutUsStatsData } from '@/utils/aboutUsStatsData';
import { useSpring, useTransform, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const Counter = ({ value }: { value: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [displayValue, setDisplayValue] = useState('0');
  const numValue = parseInt(value.replace(/[^0-9]/g, ''));
  const suffix = value.replace(/[0-9,]/g, '');
  const hasComma = value.includes(',');

  const springValue = useSpring(0, {
    mass: 1,
    stiffness: 50,
    damping: 15,
    duration: 2,
  });

  const rounded = useTransform(springValue, (latest) => {
    return Math.floor(latest);
  });

  useEffect(() => {
    if (inView) {
      springValue.set(numValue);
    }
  }, [inView, numValue, springValue]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => {
      let formatted = latest.toString();
      if (hasComma) {
        formatted = latest.toLocaleString('en-US');
      }
      setDisplayValue(formatted + suffix);
    });

    return () => unsubscribe();
  }, [rounded, suffix, hasComma]);

  return <span ref={ref}>{displayValue}</span>;
};

const AboutUsStats = () => {
  return (
    <section className={styles.statsSection}>
      <ul className={styles.statsContainer}>
        {aboutUsStatsData.map((stat, index) => (
          <li key={stat.id} className={styles.statItem}>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                <Counter value={stat.value} />
              </div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
            {index < aboutUsStatsData.length - 1 && <div className={styles.statDivider}></div>}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AboutUsStats;
