import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ICON_MOON_SLEEP, ICON_CLOCK, ICON_SPARKLES, ICON_GRAPH } from '@/constants/icons';
import type { AssessmentTileModel } from '../dashboardViewModel.util';
import { SEVERITY_BANNER_MAP } from './severityBanner';
import styles from './styles.module.css';

interface AssessmentTileProps {
  data: AssessmentTileModel;
}

export function AssessmentTile({ data }: AssessmentTileProps) {
  const { status, value, subtitle, description, bannerText, lastAssessed, ctaLabel, severityBand } = data;

  const isCompleted = status === 'completed';

  if (!isCompleted) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.badge}>SLEEP ASSESSMENT</span>
            <h2 className={styles.title}>{value}</h2>
          </div>
          <div className={styles.bedIconWrapper}>
            <Icon icon={ICON_MOON_SLEEP} className={styles.bedIcon} />
          </div>
        </div>
        <p className={styles.subtitle}>{subtitle}</p>
        <Link href="/sleep-assessment" className={styles.startBtn}>
          {ctaLabel}
        </Link>
      </div>
    );
  }

  const renderBannerText = (text?: string) => {
    if (!text) return null;
    // Replace **text** with <strong>text</strong>
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // eslint-disable-next-line react/no-danger
    return <p className={styles.bannerText} dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  const bannerEntry = SEVERITY_BANNER_MAP[severityBand ?? 'none'];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.mainInfo}>
          <div className={styles.graphIconWrapper}>
            <Icon icon={ICON_GRAPH} className={styles.graphIcon} />
          </div>
          <div className={styles.titleGroup}>
            <span className={styles.badge}>
              SLEEP ASSESSMENT <span className={styles.separator}>•</span> {subtitle}
            </span>
            <h2 className={styles.title}>{value}</h2>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.lastAssessed}>
            <Icon icon={ICON_CLOCK} className={styles.clockIcon} />
            <span>Last assessed: {lastAssessed}</span>
          </div>
          <div className={styles.bedIconWrapper}>
            <Icon icon={ICON_MOON_SLEEP} className={styles.bedIcon} />
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.footer}>
        <div className={`${styles.banner} ${styles[bannerEntry.themeClass]}`}>
          <div className={styles.bannerIconWrapper}>
            <Icon icon={bannerEntry.icon} className={styles.bannerIcon} />
          </div>
          {renderBannerText(bannerText || bannerEntry.fallbackText)}
        </div>

        <div className={styles.ctaGroup}>
          <Link href="/sleep-assessment" className={styles.viewPlanBtn}>
            {ctaLabel}
          </Link>
          <div className={styles.tooltip}>
            <Icon icon={ICON_SPARKLES} className={styles.sparkleIcon} />
            <p>Explore your tailored recommendations, habits, and next best steps.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
