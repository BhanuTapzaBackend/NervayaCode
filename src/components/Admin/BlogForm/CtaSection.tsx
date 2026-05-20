'use client';

import { Icon } from '@iconify/react';
import styles from './styles.module.css';

interface CtaSectionProps {
  ctaText: string;
  ctaLink: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CtaSection({ ctaText, ctaLink, onInputChange }: CtaSectionProps) {
  return (
    <div className={styles.seoSection}>
      <div className={styles.seoToggle} style={{ cursor: 'default', background: 'var(--color-background-page)' }}>
        <div className={styles.seoToggleLeft}>
          <Icon icon="solar:link-bold-duotone" width={20} height={20} />
          <span>Call to Action (CTA) Settings</span>
        </div>
      </div>

      <div className={styles.seoContent}>
        <div className={styles.seoFields}>
          <div className={styles.formGroup}>
            <label htmlFor="ctaText" className={styles.label}>
              Button Text
            </label>
            <input
              type="text"
              id="ctaText"
              name="ctaText"
              value={ctaText}
              onChange={onInputChange}
              className={styles.input}
              placeholder="e.g. Try Deep Rest Now"
            />
            <p className={styles.seoHint}>The text that will appear on the button.</p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="ctaLink" className={styles.label}>
              Redirect Link
            </label>
            <input
              type="text"
              id="ctaLink"
              name="ctaLink"
              value={ctaLink}
              onChange={onInputChange}
              className={styles.input}
              placeholder="e.g. /deep-rest or https://example.com"
            />
            <p className={styles.seoHint}>Where the button should lead to.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
