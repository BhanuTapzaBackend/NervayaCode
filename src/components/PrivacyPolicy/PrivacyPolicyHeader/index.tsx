import { Icon } from '@iconify/react';
import { ICON_CLOCK } from '@/constants/icons';
import styles from './styles.module.css';

interface PrivacyPolicyHeaderProps {
  title?: string;
  subtitle?: string;
  lastUpdated?: string;
}

const PrivacyPolicyHeader = ({
  title = 'Privacy Policy',
  subtitle = 'Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.',
  lastUpdated = 'January 1, 2026',
}: PrivacyPolicyHeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.headerTitle}>{title}</h1>
        <p className={styles.headerSubtitle}>{subtitle}</p>
        <div className={styles.lastUpdated}>
          <Icon icon={ICON_CLOCK} />
          <span>Last Updated: {lastUpdated}</span>
        </div>
      </div>
    </header>
  );
};

export default PrivacyPolicyHeader;
