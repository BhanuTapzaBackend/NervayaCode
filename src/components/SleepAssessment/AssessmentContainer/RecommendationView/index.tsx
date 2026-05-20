'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { ICON_INFO } from '@/constants/icons';
import { type AssessmentResult, type ServiceKey, getBundleItems, getTherapyPriority } from '@/utils/sleepAssessment';
import { cartApi } from '@/lib/api/cart';
import { ITEM_TYPE } from '@/lib/constants/enums';
import { DRIFT_OFF_SESSION_IMAGE } from '@/lib/constants/driftOff.constants';
import { SLEEP_PLAN_BUNDLE_SOURCE } from '@/lib/constants/sleepPlan.constants';
import { useCart } from '@/context/CartContext';
import { HeroHeader } from './HeroHeader';
import { KeyPatternsCard } from './KeyPatternsCard';
import { PersonalizedPlanCard } from './PersonalizedPlanCard';
import { TherapyHighlightCard } from './TherapyHighlightCard';
import { BenefitsTimeline } from './BenefitsTimeline';
import { IndividualModulesGrid } from './IndividualModulesGrid';
import { TherapistSelectionModal, type TherapistSelection, type TherapyAction } from './TherapistSelectionModal';
import { useSleepPlanData } from './useSleepPlanData';
import styles from './styles.module.css';

interface RecommendationViewProps {
  result: AssessmentResult;
}

type AddingState = 'plan' | 'cart' | 'therapy' | `mod:${string}` | null;

export function RecommendationView({ result }: Readonly<RecommendationViewProps>) {
  const router = useRouter();
  const { refreshCart } = useCart();
  const plan = useSleepPlanData();

  const [therapistModalOpen, setTherapistModalOpen] = useState(false);
  const [adding, setAdding] = useState<AddingState>(null);

  const handleModalClose = useCallback(() => {
    setTherapistModalOpen(false);
    // Closing without confirming must clear any therapy "Adding..." state, else
    // the Therapy card's button stays disabled (unclickable) forever.
    setAdding((prev) => (prev === 'mod:therapy' || prev === 'therapy' ? null : prev));
  }, []);

  const bundleItems = useMemo(() => getBundleItems(result.services), [result.services]);
  const therapyPriority = useMemo(() => getTherapyPriority(result.services), [result.services]);
  const showBundle = bundleItems.length > 0 && !!plan.supplement;
  const showTherapy = therapyPriority !== 'None';

  const supplementPrice = plan.supplement?.price ?? 0;

  const itemUnitPrice = useCallback(
    (key: ServiceKey): number => {
      if (key === 'SUPPLEMENT') return supplementPrice;
      if (key === 'GUIDED_AUDIO') return plan.deepRestPrice;
      return 0;
    },
    [supplementPrice, plan.deepRestPrice],
  );

  const { originalPrice, discountedPrice, savingsAmount } = useMemo(() => {
    const original = bundleItems.reduce((sum, key) => sum + itemUnitPrice(key), 0);
    const discounted = Math.round(original * (1 - plan.discountPct / 100));
    return {
      originalPrice: original,
      discountedPrice: discounted,
      savingsAmount: original - discounted,
    };
  }, [bundleItems, itemUnitPrice, plan.discountPct]);

  const addBundleItems = useCallback(async () => {
    for (const key of bundleItems) {
      if (key === 'SUPPLEMENT' && plan.supplement) {
        await cartApi.add(
          plan.supplement._id,
          1,
          ITEM_TYPE.SUPPLEMENT,
          plan.supplement.name,
          plan.supplement.price,
          plan.supplement.image,
          { source: SLEEP_PLAN_BUNDLE_SOURCE },
        );
      } else if (key === 'GUIDED_AUDIO') {
        await cartApi.add(
          'drift-off-session',
          1,
          ITEM_TYPE.DRIFT_OFF,
          'Deep Rest Session',
          plan.deepRestPrice,
          DRIFT_OFF_SESSION_IMAGE,
          { source: SLEEP_PLAN_BUNDLE_SOURCE },
        );
      }
    }
  }, [bundleItems, plan.supplement, plan.deepRestPrice]);

  const handleStartPlan = useCallback(async () => {
    if (!showBundle) return;
    setAdding('plan');
    try {
      await addBundleItems();
      await refreshCart();
      router.push('/checkout');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start your plan');
      setAdding(null);
    }
  }, [showBundle, addBundleItems, refreshCart, router]);

  const handleAddPlanToCart = useCallback(async () => {
    if (!showBundle) return;
    setAdding('cart');
    try {
      await addBundleItems();
      await refreshCart();
      toast.success('Your sleep plan was added to cart');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add plan to cart');
    } finally {
      setAdding(null);
    }
  }, [showBundle, addBundleItems, refreshCart]);

  const handleTherapyConfirm = useCallback(
    async (selection: TherapistSelection, action: TherapyAction) => {
      setTherapistModalOpen(false);
      setAdding('therapy');
      try {
        await cartApi.add(
          selection.therapistId,
          1,
          ITEM_TYPE.THERAPY,
          selection.therapistName,
          selection.sessionFee,
          selection.therapistImage,
          { date: selection.date, slot: selection.slot },
        );
        await refreshCart();
        if (action === 'book') {
          router.push('/checkout');
          return;
        }
        toast.success('Therapy session added to cart');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not add therapy to cart');
      } finally {
        setAdding(null);
      }
    },
    [refreshCart, router],
  );

  const handleIndividualAdd = useCallback(
    async (id: 'supplement' | 'deep-rest' | 'therapy') => {
      setAdding(`mod:${id}`);
      try {
        if (id === 'supplement' && plan.supplement) {
          await cartApi.add(
            plan.supplement._id,
            1,
            ITEM_TYPE.SUPPLEMENT,
            plan.supplement.name,
            plan.supplement.price,
            plan.supplement.image,
          );
          await refreshCart();
          toast.success('Added to cart');
        } else if (id === 'deep-rest') {
          await cartApi.add(
            'drift-off-session',
            1,
            ITEM_TYPE.DRIFT_OFF,
            'Deep Rest Session',
            plan.deepRestPrice,
            DRIFT_OFF_SESSION_IMAGE,
          );
          await refreshCart();
          toast.success('Added to cart');
        } else if (id === 'therapy') {
          setTherapistModalOpen(true);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not add to cart');
      } finally {
        if (id !== 'therapy') setAdding(null);
      }
    },
    [plan.supplement, plan.deepRestPrice, refreshCart],
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>
        <div className={styles.hero}>
          <HeroHeader />
          <KeyPatternsCard patterns={result.patterns} />
        </div>

        {plan.loading && (
          <div className={styles.errorBanner}>
            <Icon icon={ICON_INFO} aria-hidden />
            Loading your personalized pricing…
          </div>
        )}

        {!plan.loading && !plan.pricingConfigured && (
          <div className={styles.errorBanner} role="alert">
            <Icon icon={ICON_INFO} aria-hidden />
            {plan.error ?? 'Sleep plan pricing is not available right now. Please try again later.'}
          </div>
        )}

        {!plan.loading && plan.pricingConfigured && (
          <>
            {showBundle && (
              <PersonalizedPlanCard
                bundleItems={bundleItems}
                supplementName={plan.supplement?.name ?? 'Nervaya Sleep Supplement'}
                loading={plan.loading}
                error={plan.error}
                originalPrice={originalPrice}
                discountedPrice={discountedPrice}
                savingsAmount={savingsAmount}
                discountPct={plan.discountPct}
                onStartPlan={handleStartPlan}
                onAddPlanToCart={handleAddPlanToCart}
                adding={adding}
              />
            )}

            {showTherapy && (
              <TherapyHighlightCard
                therapyPrice={plan.therapyPrice}
                isAdding={adding === 'therapy'}
                onAddToCart={() => setTherapistModalOpen(true)}
              />
            )}

            <BenefitsTimeline />

            <IndividualModulesGrid
              supplement={plan.supplement}
              deepRestPrice={plan.deepRestPrice}
              therapyPrice={plan.therapyPrice}
              adding={adding}
              onAdd={handleIndividualAdd}
            />
          </>
        )}
      </div>

      {therapistModalOpen && (
        <TherapistSelectionModal
          fallbackPrice={plan.therapyPrice}
          result={result}
          onConfirm={handleTherapyConfirm}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
