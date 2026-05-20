import type { ReactNode } from 'react';
import { Icon } from '@iconify/react';
import styles from './styles.module.css';

interface FormSectionProps {
  title?: string;
  icon?: string;
  children: ReactNode;
}

export function FormSection({ title, icon, children }: FormSectionProps) {
  return (
    <section className={styles.section}>
      {title && icon && (
        <h2 className={styles.title}>
          <Icon icon={icon} />
          <span>{title}</span>
        </h2>
      )}
      {children}
    </section>
  );
}
