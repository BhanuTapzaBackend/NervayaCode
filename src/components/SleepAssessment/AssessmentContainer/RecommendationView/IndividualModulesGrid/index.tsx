import { ICON_CLOCK, ICON_CHECK, ICON_HEADPHONES, ICON_USER, ICON_SPARKLES } from '@/constants/icons';
import { THERAPIST_RECOMMENDATION_MODAL_ENABLED } from '@/lib/constants/sleepPlan.constants';
import { IMAGES } from '@/utils/imageConstants';
import type { Supplement } from '@/types/supplement.types';
import { IndividualModuleCard } from '../IndividualModuleCard';
import styles from './styles.module.css';

interface IndividualModulesGridProps {
  supplement: Supplement | null;
  deepRestPrice: number;
  therapyPrice: number;
  adding: 'plan' | 'cart' | 'therapy' | `mod:${string}` | null;
  onAdd: (id: 'supplement' | 'deep-rest' | 'therapy') => void;
}

export function IndividualModulesGrid({
  supplement,
  deepRestPrice,
  therapyPrice,
  adding,
  onAdd,
}: Readonly<IndividualModulesGridProps>) {
  return (
    <section className={styles.section} aria-label="Explore modules individually">
      <header className={styles.header}>
        <h2 className={styles.title}>Explore or add modules individually</h2>
        <p className={styles.subtitle}>Each support is effective on its own — choose what feels right for you.</p>
      </header>

      <div className={styles.grid}>
        {supplement && (
          <IndividualModuleCard
            imageSrc={IMAGES.PRODUCT_SLEEP_SUPPLEMENT}
            name={supplement.name}
            chip="SUPPLEMENT"
            chipTone="amber"
            description={
              supplement.shortDescription ||
              'Clinically inspired formula to support your body’s natural ability to wind down and stay asleep.'
            }
            metaItems={[
              { icon: ICON_CLOCK, text: '30-day supply' },
              { icon: ICON_CHECK, text: 'Daily support' },
            ]}
            price={supplement.price}
            ctaLabel="Add to Cart"
            isAdding={adding === 'mod:supplement'}
            onAdd={() => onAdd('supplement')}
          />
        )}

        <IndividualModuleCard
          imageSrc={IMAGES.PRODUCT_DEEP_REST}
          name="Deep Rest"
          meta="1 tailored session"
          chip="AUDIO SESSION"
          chipTone="emerald"
          description="A personalized audio session created just for you based on an exhaustive questionnaire after payment."
          metaItems={[
            { icon: ICON_CLOCK, text: '1 tailored session' },
            { icon: ICON_HEADPHONES, text: 'Listen anytime' },
          ]}
          price={deepRestPrice}
          ctaLabel="Add to Cart"
          isAdding={adding === 'mod:deep-rest'}
          onAdd={() => onAdd('deep-rest')}
        />

        <IndividualModuleCard
          imageSrc={IMAGES.CARD_THERAPY_SESSION}
          name="Therapy Corner"
          meta="1 session"
          chip="THERAPEUTIC SUPPORT"
          chipTone="accent"
          description="A 1:1 expert session to address stress patterns and root causes impacting your sleep."
          metaItems={[
            { icon: ICON_USER, text: '1 expert session' },
            { icon: ICON_SPARKLES, text: 'Personalized for you' },
          ]}
          price={therapyPrice}
          ctaLabel={THERAPIST_RECOMMENDATION_MODAL_ENABLED ? 'Add to Cart' : 'Choose a Therapist'}
          isAdding={adding === 'mod:therapy'}
          onAdd={() => onAdd('therapy')}
        />
      </div>
    </section>
  );
}
