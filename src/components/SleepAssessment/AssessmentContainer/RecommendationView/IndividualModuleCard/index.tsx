'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/utils/currencyConstants';
import styles from './styles.module.css';

interface MetaItem {
  icon: string;
  text: string;
}

interface IndividualModuleCardProps {
  imageSrc: string;
  name: string;
  chip: string;
  chipTone: 'accent' | 'amber' | 'emerald';
  meta?: string;
  description: string;
  metaItems: [MetaItem, MetaItem];
  price: number;
  ctaLabel: string;
  isAdding: boolean;
  onAdd: () => void;
}

export function IndividualModuleCard({
  imageSrc,
  name,
  chip,
  chipTone,
  meta,
  description,
  metaItems,
  price,
  ctaLabel,
  isAdding,
  onAdd,
}: Readonly<IndividualModuleCardProps>) {
  const chipToneClass = styles[`chip_${chipTone}`];
  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={imageSrc}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1023px) 50vw, 33vw"
          className={styles.image}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.head}>
          <h3 className={styles.name}>
            {name}
            {meta && <span className={styles.metaInline}> ({meta})</span>}
          </h3>
          <span className={`${styles.chip} ${chipToneClass}`}>{chip}</span>
        </div>

        <p className={styles.desc}>{description}</p>

        <div className={styles.bottom}>
          <div className={styles.metaRow}>
            {metaItems.map((m) => (
              <span key={m.text} className={styles.metaItem}>
                <Icon icon={m.icon} aria-hidden className={styles.metaIcon} />
                {m.text}
              </span>
            ))}
          </div>

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatCurrency(price)}</span>
            <button type="button" className={styles.cta} onClick={onAdd} disabled={isAdding}>
              {isAdding ? 'Adding...' : ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
