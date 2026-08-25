'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { ICON_INFO } from '@/constants/icons';
import type { AssessmentResult } from '@/utils/sleepAssessment';
import { cartApi } from '@/lib/api/cart';
import { ITEM_TYPE } from '@/lib/constants/enums';
import { DRIFT_OFF_SESSION_IMAGE } from '@/lib/constants/driftOff.constants';
import { THERAPIST_RECOMMENDATION_MODAL_ENABLED } from '@/lib/constants/sleepPlan.constants';
import { useCart } from '@/context/CartContext';
import { HeroHeader } from './HeroHeader';
import { KeyPatternsCard } from './KeyPatternsCard';
import { PersonalizedPlanCard } from './PersonalizedPlanCard';
import { TherapyHighlightCard } from './TherapyHighlightCard';
import { BenefitsTimeline } from './BenefitsTimeline';
import { IndividualModulesGrid } from './IndividualModulesGrid';
import { TherapistSelectionModal } from './TherapistSelectionModal';
import { useSleepPlanData } from './useSleepPlanData';
import { useBundleCheckout, type AddingState } from './useBundleCheckout';
import styles from './styles.module.css';

interface RecommendationViewProps {
  result: AssessmentResult;
}

export function RecommendationView({ result }: Readonly<RecommendationViewProps>) {
  const { refreshCart } = useCart();
  const plan = useSleepPlanData();

  const [therapistModalOpen, setTherapistModalOpen] = useState(false);
  const [adding, setAdding] = useState<AddingState>(null);

  const openTherapistModal = useCallback(() => setTherapistModalOpen(true), []);
  const closeTherapistModal = useCallback(() => setTherapistModalOpen(false), []);

  const bundle = useBundleCheckout({
    result,
    plan,
    setAdding,
    openTherapistModal,
    closeTherapistModal,
    refreshCart,
  });

  const handleModalClose = useCallback(() => {
    setTherapistModalOpen(false);
    bundle.resetTherapyFlow();
    // Without this, dismissing the modal leaves the originating CTA stuck in "Adding..." forever.
    setAdding((prev) =>
      prev === 'mod:therapy' || prev === 'therapy' || prev === 'plan' || prev === 'cart' ? null : prev,
    );
  }, [bundle]);

  const handleIndividualAdd = useCallback(
    async (id: 'supplement' | 'deep-rest' | 'therapy') => {
      if (id === 'therapy') {
        bundle.startTherapySelection();
        return;
      }
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
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not add to cart');
      } finally {
        setAdding(null);
      }
    },
    [plan.supplement, plan.deepRestPrice, refreshCart, bundle],
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
            {bundle.showBundle && (
              <PersonalizedPlanCard
                bundleItems={bundle.bundleItems}
                supplementName={plan.supplement?.name ?? 'Nervaya Sleep Supplement'}
                loading={plan.loading}
                error={plan.error}
                originalPrice={bundle.pricing.originalPrice}
                discountedPrice={bundle.pricing.discountedPrice}
                savingsAmount={bundle.pricing.savingsAmount}
                discountPct={plan.discountPct}
                onStartPlan={bundle.handleStartPlan}
                onAddPlanToCart={bundle.handleAddPlanToCart}
                adding={adding}
                selectedItems={bundle.selectedItems}
                selectedCount={bundle.selectedCount}
                onToggleItem={bundle.toggleItem}
              />
            )}

            {bundle.showTherapy && (
              <TherapyHighlightCard
                therapyPrice={plan.therapyPrice}
                isAdding={adding === 'therapy'}
                onAddToCart={bundle.startTherapySelection}
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

      {THERAPIST_RECOMMENDATION_MODAL_ENABLED && therapistModalOpen && (
        <TherapistSelectionModal
          fallbackPrice={plan.therapyPrice}
          result={result}
          onConfirm={bundle.handleTherapyConfirm}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
