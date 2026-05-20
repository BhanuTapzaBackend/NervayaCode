import { Icon } from '@iconify/react';
import { ICON_SHIELD_CHECK } from '@/constants/icons';
import type { SleepPattern, SleepPatternSeverity } from '@/utils/sleepAssessment';
import styles from './styles.module.css';

interface KeyPatternsCardProps {
  patterns: SleepPattern[];
}

const SEVERITY_LABEL: Record<SleepPatternSeverity, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
};

export function KeyPatternsCard({ patterns }: Readonly<KeyPatternsCardProps>) {
  return (
    <aside className={styles.card} aria-label="Your key sleep patterns">
      <h2 className={styles.title}>YOUR KEY SLEEP PATTERNS</h2>

      <ul className={styles.list}>
        {patterns.map((p) => {
          const severityClass = styles[`badge_${p.severity}`];
          return (
            <li key={p.id} className={styles.row}>
              <span className={styles.rowIcon}>
                <Icon icon={p.icon} aria-hidden />
              </span>
              <div className={styles.rowText}>
                <p className={styles.rowName}>{p.name}</p>
                <p className={styles.rowSub}>{p.subText}</p>
              </div>
              <span className={`${styles.badge} ${severityClass}`}>{SEVERITY_LABEL[p.severity]}</span>
            </li>
          );
        })}
      </ul>

      <p className={styles.footer}>
        <Icon icon={ICON_SHIELD_CHECK} aria-hidden className={styles.footerIcon} />
        These patterns are derived from your assessment responses.
      </p>
    </aside>
  );
}
