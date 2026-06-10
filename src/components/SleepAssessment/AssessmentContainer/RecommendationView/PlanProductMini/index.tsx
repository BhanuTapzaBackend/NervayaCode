import Image from 'next/image';
import { Icon } from '@iconify/react';
import styles from './styles.module.css';

export interface PlanProductMiniProps {
  icon: string;
  iconAccent: 'accent' | 'amber' | 'emerald';
  title: string;
  subtitle: string;
  description: string;
  metaIcon: string;
  metaText: string;
  meta2Icon: string;
  meta2Text: string;
  imageSrc: string;
}

export function PlanProductMini({
  icon,
  iconAccent,
  title,
  subtitle,
  description,
  metaIcon,
  metaText,
  meta2Icon,
  meta2Text,
  imageSrc,
}: Readonly<PlanProductMiniProps>) {
  const iconAccentClass = styles[`icon_${iconAccent}`];
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={`${styles.icon} ${iconAccentClass}`}>
          <Icon icon={icon} aria-hidden />
        </span>
        <h3 className={styles.title}>{title}</h3>
      </div>

      <div className={styles.contentWrap}>
        <div className={styles.imageContainer}>
          <Image src={imageSrc} alt={title} fill sizes="140px" className={styles.productImage} />
        </div>
        <div className={styles.textWrap}>
          <p className={styles.subtitle}>{subtitle}</p>
          <p className={styles.desc}>{description}</p>
        </div>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.meta}>
          <Icon icon={metaIcon} aria-hidden className={styles.metaIcon} />
          {metaText}
        </span>
        <span className={styles.meta}>
          <Icon icon={meta2Icon} aria-hidden className={styles.metaIcon} />
          {meta2Text}
        </span>
      </div>
    </div>
  );
}
