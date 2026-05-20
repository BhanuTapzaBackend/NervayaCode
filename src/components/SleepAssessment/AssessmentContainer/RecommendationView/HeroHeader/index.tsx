import { Icon } from '@iconify/react';
import { ICON_SPARKLES, ICON_INFO } from '@/constants/icons';
import styles from './styles.module.css';

export function HeroHeader() {
  return (
    <div className={styles.wrap}>
      <div className={styles.eyebrow}>
        <Icon icon={ICON_SPARKLES} aria-hidden />
        <span>YOUR SLEEP ASSESSMENT RESULTS</span>
      </div>
      <h1 className={styles.heading}>
        Here&apos;s what we noticed about <span className={styles.accent}>your sleep</span>
      </h1>
      <p className={styles.body}>
        Your responses reflect patterns that may be affecting the quality of your sleep and daytime recovery.
      </p>

      <aside className={styles.disclaimerCard} aria-label="Important note about your results">
        <span className={styles.disclaimerIconWrap}>
          <Icon icon={ICON_INFO} aria-hidden className={styles.disclaimerIcon} />
        </span>
        <p className={styles.disclaimerText}>
          These insights are a reflection of your responses to our assessment and are for educational purposes only.
          They are not a medical diagnosis.
        </p>
      </aside>
    </div>
  );
}
