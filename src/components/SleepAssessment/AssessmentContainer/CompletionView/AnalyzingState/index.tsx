import styles from './styles.module.css';

export function AnalyzingState() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.ringStack} aria-hidden>
        <span className={`${styles.ring} ${styles.ringOuter}`} />
        <span className={`${styles.ring} ${styles.ringMid}`} />
        <span className={`${styles.ring} ${styles.ringInner}`} />
        <span className={styles.core} />
      </div>
      <p className={styles.label}>
        Analyzing your sleep patterns
        <span className={styles.dots} aria-hidden>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      </p>
      <p className={styles.sub}>Reading your responses to craft a personalized insight…</p>
    </div>
  );
}
