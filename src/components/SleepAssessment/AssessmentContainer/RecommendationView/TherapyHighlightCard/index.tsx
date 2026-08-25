'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ICON_USER, ICON_SPARKLES, ICON_ARROW_RIGHT, ICON_SHIELD_USER } from '@/constants/icons';
import { IMAGES } from '@/utils/imageConstants';
import { THERAPIST_RECOMMENDATION_MODAL_ENABLED } from '@/lib/constants/sleepPlan.constants';
import { formatCurrency } from '@/utils/currencyConstants';
import styles from './styles.module.css';

interface TherapyHighlightCardProps {
  therapyPrice: number;
  isAdding: boolean;
  onAddToCart: () => void;
}

export function TherapyHighlightCard({ therapyPrice, isAdding, onAddToCart }: Readonly<TherapyHighlightCardProps>) {
  let ctaLabel = 'Choose a Therapist';
  if (THERAPIST_RECOMMENDATION_MODAL_ENABLED) ctaLabel = isAdding ? 'Adding...' : 'Add to Cart';

  return (
    <section className={styles.card} aria-label="Therapy Corner — additional support">
      <span className={styles.eyebrow}>YOU MAY ALSO BENEFIT FROM</span>

      <div className={styles.body}>
        <div className={styles.imageWrap}>
          <Image src={IMAGES.CARD_THERAPY_SESSION} alt="Therapy session" fill sizes="150px" className={styles.image} />
        </div>

        <div className={styles.info}>
          <div className={styles.titleLine}>
            <h3 className={styles.title}>
              Therapy Corner <span className={styles.titleMeta}>(1 session)</span>
            </h3>
          </div>
          <p className={styles.desc}>
            A 1:1 expert session to address stress patterns and root causes impacting your sleep over the long term.
          </p>
        </div>

        <div className={styles.metaCol}>
          <span className={styles.metaItem}>
            <Icon icon={ICON_USER} aria-hidden className={styles.metaIcon} />
            <span className={styles.metaText}>1 expert session</span>
          </span>
          <span className={styles.metaItem}>
            <Icon icon={ICON_SHIELD_USER} aria-hidden className={styles.metaIcon} />
            <span className={styles.metaText}>Personalized for you</span>
          </span>
        </div>

        <div className={styles.whyBox}>
          <div className={styles.whyIcon}>
            <Icon icon={ICON_SPARKLES} aria-hidden />
          </div>
          <div className={styles.whyContent}>
            <p className={styles.whyTitle}>Why consider it?</p>
            <p className={styles.whyBody}>
              For many, addressing underlying stress and thought patterns can lead to deeper, long-lasting improvement.
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <div className={styles.priceContainer}>
            <span className={styles.price}>{formatCurrency(therapyPrice)}</span>
            <button
              type="button"
              className={styles.cta}
              onClick={onAddToCart}
              disabled={THERAPIST_RECOMMENDATION_MODAL_ENABLED && isAdding}
            >
              {ctaLabel}
            </button>
          </div>
          <Link href="/therapy-corner" className={styles.learnMore}>
            Learn more
            <Icon icon={ICON_ARROW_RIGHT} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
