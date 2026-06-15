import Image from 'next/image';
import { Icon } from '@iconify/react';
import { ICON_CHECK } from '@/constants/icons';
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
  selected?: boolean;
  disableToggle?: boolean;
  onToggle?: () => void;
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
  selected = true,
  disableToggle = false,
  onToggle,
}: Readonly<PlanProductMiniProps>) {
  const iconAccentClass = styles[`icon_${iconAccent}`];
  const isExcluded = !!onToggle && !selected;
  return (
    <div className={`${styles.card} ${isExcluded ? styles.excluded : ''}`}>
      <div className={styles.header}>
        <span className={`${styles.icon} ${iconAccentClass}`}>
          <Icon icon={icon} aria-hidden />
        </span>
        <h3 className={styles.title}>{title}</h3>
        {onToggle && (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={title}
            disabled={disableToggle}
            onClick={onToggle}
            className={`${styles.checkbox} ${selected ? styles.checkboxOn : ''}`}
          >
            {selected && <Icon icon={ICON_CHECK} aria-hidden />}
          </button>
        )}
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
