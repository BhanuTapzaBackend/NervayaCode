'use client';

import Link from 'next/link';
import styles from './styles.module.css';

const DriftOffHeaderActions = () => {
  return (
    <div className={styles.headerActions}>
      <Link href="#" className={styles.buttonPrimary}>
        Buy tailored audio &gt;
      </Link>
      <Link href="#" className={styles.buttonSecondary}>
        What are Deep Rest sessions? &gt;
      </Link>
    </div>
  );
};

export default DriftOffHeaderActions;
