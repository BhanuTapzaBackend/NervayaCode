'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './not-found.module.css';
import { LazyMotion, m } from 'framer-motion';
import { IMAGES } from '@/utils/imageConstants';

export default function NotFound() {
  useEffect(() => {
    // Standard professional layout
  }, []);

  return (
    <LazyMotion features={() => import('framer-motion').then((mod) => mod.domAnimation)}>
      <div className={styles.container} style={{ '--bg-404': `url(${IMAGES.NOT_FOUND_404})` } as React.CSSProperties}>
        <m.div
          className={styles.glow}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <m.div
          className={styles.secondaryGlow}
          animate={{
            translateY: [0, -20, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className={styles.content}>
          <m.h1
            className={styles.title}
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            404
          </m.h1>

          <m.div
            className={styles.contentBlock}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className={styles.subtitle}>Oops! Page Not Found</h2>

            <p className={styles.description}>
              The page you are looking for might have been moved, deleted, or is temporarily unavailable.
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
          >
            <Link href="/" className={styles.button}>
              Return Home
            </Link>
          </m.div>
        </div>
      </div>
    </LazyMotion>
  );
}
