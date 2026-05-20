'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { ICON_TICK_ROUND } from '@/constants/icons';
import type { Supplement } from '@/types/supplement.types';
import styles from './TabDescription.module.css';

interface TabDescriptionProps {
  supplement: Supplement;
}

const TabDescription: React.FC<TabDescriptionProps> = ({ supplement }) => {
  return (
    <div className={styles.content}>
      <div className={styles.overview}>
        <h3 className={styles.heading}>Product Overview</h3>
        {/* eslint-disable-next-line react/no-danger */}
        <div className={styles.htmlContent} dangerouslySetInnerHTML={{ __html: supplement.description }} />
      </div>

      {supplement.benefits.length > 0 && (
        <div className={styles.benefits}>
          <h3 className={styles.heading}>Key Benefits</h3>
          <ul className={styles.list}>
            {supplement.benefits.map((benefit) => (
              <li key={benefit} className={styles.listItem}>
                <span className={styles.bulletDot} />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dynamic Custom Sections */}
      {supplement.additionalSections?.map((section) => (
        <div key={`section-${section.title}`} className={styles.customSection}>
          <h3 className={styles.heading}>{section.title}</h3>
          {section.content.length > 0 ? (
            <ul className={styles.list}>
              {section.content.map((point) => (
                <li key={`sec-item-${section.title}-${point.substring(0, 30)}`} className={styles.listItem}>
                  <span className={styles.bulletDot} />
                  {point}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.paragraph}>No details provided.</p>
          )}
        </div>
      ))}

      {supplement.suggestedUse && (
        <div className={styles.suggestedUse}>
          <h3 className={styles.heading}>Suggested Use</h3>
          <p className={styles.paragraph}>{supplement.suggestedUse}</p>
        </div>
      )}

      {supplement.ingredients.length > 0 && (
        <div className={styles.ingredients}>
          <h3 className={styles.heading}>Ingredients</h3>
          <ul className={styles.list}>
            {supplement.ingredients.map((ingredient) => (
              <li key={ingredient} className={styles.listItem}>
                <Icon icon={ICON_TICK_ROUND} className={styles.tickIcon} />
                {ingredient}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TabDescription;
