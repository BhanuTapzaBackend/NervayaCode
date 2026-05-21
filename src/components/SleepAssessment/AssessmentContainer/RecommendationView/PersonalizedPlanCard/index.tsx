import { IMAGES } from '@/utils/imageConstants';
import { Fragment } from 'react';
import { ICON_HEADPHONES, ICON_PILL, ICON_CLOCK, ICON_CHECK } from '@/constants/icons';
import type { ServiceKey } from '@/utils/sleepAssessment';
import { PlanProductMini, type PlanProductMiniProps } from '../PlanProductMini';
import { PlanPricingPanel } from '../PlanPricingPanel';
import styles from './styles.module.css';

interface PersonalizedPlanCardProps {
  bundleItems: ServiceKey[];
  supplementName: string;
  loading: boolean;
  error: string | null;
  originalPrice: number;
  discountedPrice: number;
  savingsAmount: number;
  discountPct: number;
  onStartPlan: () => void;
  onAddPlanToCart: () => void;
  adding: 'plan' | 'cart' | 'therapy' | `mod:${string}` | null;
}

function getMiniProps(key: ServiceKey, supplementName: string): PlanProductMiniProps | null {
  if (key === 'GUIDED_AUDIO') {
    return {
      icon: ICON_HEADPHONES,
      iconAccent: 'emerald',
      title: 'Deep Rest',
      chip: 'AUDIO SESSION',
      chipTone: 'emerald',
      subtitle: '1 tailored session',
      description:
        'A personalized audio session created just for you based on an exhaustive questionnaire after payment.',
      metaIcon: ICON_CLOCK,
      metaText: '1 tailored session',
      meta2Icon: ICON_HEADPHONES,
      meta2Text: 'Listen anytime',
      imageSrc: IMAGES.PRODUCT_DEEP_REST,
    };
  }
  if (key === 'SUPPLEMENT') {
    return {
      icon: ICON_PILL,
      iconAccent: 'amber',
      title: supplementName,
      chip: 'SUPPLEMENT',
      chipTone: 'amber',
      subtitle: '30-day supply',
      description: 'Clinically inspired formula to support your body’s natural ability to wind down and stay asleep.',
      metaIcon: ICON_CLOCK,
      metaText: '30-day supply',
      meta2Icon: ICON_CHECK,
      meta2Text: 'Daily support',
      imageSrc: IMAGES.PRODUCT_SLEEP_SUPPLEMENT,
    };
  }
  return null;
}

export function PersonalizedPlanCard({
  bundleItems,
  supplementName,
  loading,
  error,
  originalPrice,
  discountedPrice,
  savingsAmount,
  discountPct,
  onStartPlan,
  onAddPlanToCart,
  adding,
}: Readonly<PersonalizedPlanCardProps>) {
  const itemCount = bundleItems.length;
  const disabled = loading || !!error;
  const introCopy =
    itemCount === 1
      ? 'Based on your responses, we recommend focusing on the support below. It addresses the key area impacting your sleep right now.'
      : `Based on your responses, we recommend focusing on the following ${itemCount} supports. They address the key areas impacting your sleep right now.`;

  return (
    <section className={styles.card} aria-label="Your personalized sleep plan">
      <span className={styles.eyebrow}>MOST RECOMMENDED FOR YOU</span>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <h2 className={styles.title}>Your Personalized Sleep Plan</h2>
          <p className={styles.intro}>{introCopy}</p>

          <div className={`${styles.minisRow} ${itemCount === 1 ? styles.minisRowSingle : ''}`}>
            {bundleItems.map((key, i) => {
              const props = getMiniProps(key, supplementName);
              if (!props) return null;
              return (
                <Fragment key={key}>
                  {i > 0 && (
                    <span className={styles.plus} aria-hidden>
                      +
                    </span>
                  )}
                  <PlanProductMini {...props} />
                </Fragment>
              );
            })}
          </div>
        </div>

        <PlanPricingPanel
          originalPrice={originalPrice}
          discountedPrice={discountedPrice}
          savingsAmount={savingsAmount}
          discountPct={discountPct}
          itemCount={itemCount}
          onStartPlan={onStartPlan}
          onAddPlanToCart={onAddPlanToCart}
          isStarting={adding === 'plan'}
          isAdding={adding === 'cart'}
          disabled={disabled}
        />
      </div>

      {error && <p className={styles.error}>Plan pricing temporarily unavailable. Please try again shortly.</p>}
    </section>
  );
}
