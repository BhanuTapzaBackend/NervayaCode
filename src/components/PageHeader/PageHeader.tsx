import React, { type ReactNode } from 'react';
import styles from './styles.module.css';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
}

const PageHeader = ({ title, subtitle, description, actions }: Readonly<PageHeaderProps>) => {
  const hasMainBlock = Boolean(title || subtitle || description || actions);

  if (!hasMainBlock) return null;

  return (
    <div className={styles.header}>
      <div className={styles.mainRow}>
        <div className={styles.titleSection}>
          {title && <h1 className={styles.title}>{title}</h1>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
