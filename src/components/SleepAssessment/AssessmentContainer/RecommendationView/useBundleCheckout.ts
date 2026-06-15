'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { type AssessmentResult, type ServiceKey, getBundleItems, getTherapyPriority } from '@/utils/sleepAssessment';
import { cartApi } from '@/lib/api/cart';
import { ITEM_TYPE } from '@/lib/constants/enums';
import { DRIFT_OFF_SESSION_IMAGE } from '@/lib/constants/driftOff.constants';
import { SLEEP_PLAN_BUNDLE_SOURCE } from '@/lib/constants/sleepPlan.constants';
import type { SleepPlanData } from './useSleepPlanData';
import type { TherapistSelection, TherapyAction } from './TherapistSelectionModal';

export type AddingState = 'plan' | 'cart' | 'therapy' | `mod:${string}` | null;
type TherapyFlow = 'standalone' | 'plan-start' | 'plan-cart';

interface UseBundleCheckoutArgs {
  result: AssessmentResult;
  plan: SleepPlanData;
  setAdding: (next: AddingState | ((prev: AddingState) => AddingState)) => void;
  openTherapistModal: () => void;
  closeTherapistModal: () => void;
  refreshCart: () => Promise<void>;
}

export interface UseBundleCheckoutReturn {
  bundleItems: ServiceKey[];
  selectedItems: ServiceKey[];
  selectedCount: number;
  toggleItem: (key: ServiceKey) => void;
  showBundle: boolean;
  showTherapy: boolean;
  pricing: { originalPrice: number; discountedPrice: number; savingsAmount: number };
  handleStartPlan: () => Promise<void>;
  handleAddPlanToCart: () => Promise<void>;
  handleTherapyConfirm: (selection: TherapistSelection, action: TherapyAction) => Promise<void>;
  resetTherapyFlow: () => void;
}

export function useBundleCheckout({
  result,
  plan,
  setAdding,
  openTherapistModal,
  closeTherapistModal,
  refreshCart,
}: UseBundleCheckoutArgs): UseBundleCheckoutReturn {
  const router = useRouter();
  const [therapyFlow, setTherapyFlow] = useState<TherapyFlow>('standalone');

  const bundleItems = useMemo(() => getBundleItems(result.services), [result.services]);
  const [excludedItems, setExcludedItems] = useState<Set<ServiceKey>>(() => new Set());

  const selectedItems = useMemo<ServiceKey[]>(
    () => bundleItems.filter((key) => !excludedItems.has(key)),
    [bundleItems, excludedItems],
  );
  const selectedCount = selectedItems.length;
  const selectedHasTherapy = selectedItems.includes('THERAPY');

  const toggleItem = useCallback(
    (key: ServiceKey) => {
      setExcludedItems((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key); // re-include
          return next;
        }
        // Excluding: block if this is the last remaining selected item.
        const remaining = bundleItems.filter((k) => !next.has(k)).length;
        if (remaining <= 1) return prev;
        next.add(key);
        return next;
      });
    },
    [bundleItems],
  );

  const therapyPriority = useMemo(() => getTherapyPriority(result.services), [result.services]);
  const bundleHasSupplement = bundleItems.includes('SUPPLEMENT');
  const showBundle = bundleItems.length > 0 && (!bundleHasSupplement || !!plan.supplement);
  const showTherapy = therapyPriority !== 'None' && !bundleItems.includes('THERAPY');

  const supplementPrice = plan.supplement?.price ?? 0;

  const itemUnitPrice = useCallback(
    (key: ServiceKey): number => {
      if (key === 'SUPPLEMENT') return supplementPrice;
      if (key === 'GUIDED_AUDIO') return plan.deepRestPrice;
      if (key === 'THERAPY') return plan.therapyPrice;
      return 0;
    },
    [supplementPrice, plan.deepRestPrice, plan.therapyPrice],
  );

  const pricing = useMemo(() => {
    const original = selectedItems.reduce((sum, key) => sum + itemUnitPrice(key), 0);
    const discounted = Math.round(original * (1 - plan.discountPct / 100));
    return {
      originalPrice: original,
      discountedPrice: discounted,
      savingsAmount: original - discounted,
    };
  }, [selectedItems, itemUnitPrice, plan.discountPct]);

  // Therapy is excluded — it can't be added to cart without therapist/date/slot from the modal.
  const addBundleNonTherapyItems = useCallback(async () => {
    for (const key of selectedItems) {
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
  }, [selectedItems, plan.supplement, plan.deepRestPrice]);

  const handleStartPlan = useCallback(async () => {
    if (!showBundle) return;
    if (selectedHasTherapy) {
      setTherapyFlow('plan-start');
      setAdding('plan');
      openTherapistModal();
      return;
    }
    setAdding('plan');
    try {
      await addBundleNonTherapyItems();
      await refreshCart();
      router.push('/checkout');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start your plan');
      setAdding(null);
    }
  }, [showBundle, selectedHasTherapy, addBundleNonTherapyItems, refreshCart, router, setAdding, openTherapistModal]);

  const handleAddPlanToCart = useCallback(async () => {
    if (!showBundle) return;
    if (selectedHasTherapy) {
      setTherapyFlow('plan-cart');
      setAdding('cart');
      openTherapistModal();
      return;
    }
    setAdding('cart');
    try {
      await addBundleNonTherapyItems();
      await refreshCart();
      toast.success('Your sleep plan was added to cart');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add plan to cart');
    } finally {
      setAdding(null);
    }
  }, [showBundle, selectedHasTherapy, addBundleNonTherapyItems, refreshCart, setAdding, openTherapistModal]);

  const handleTherapyConfirm = useCallback(
    async (selection: TherapistSelection, action: TherapyAction) => {
      closeTherapistModal();
      const flow = therapyFlow;
      setTherapyFlow('standalone');
      const fromBundle = flow === 'plan-start' || flow === 'plan-cart';
      if (!fromBundle) setAdding('therapy');
      try {
        await cartApi.add(
          selection.therapistId,
          1,
          ITEM_TYPE.THERAPY,
          selection.therapistName,
          selection.sessionFee,
          selection.therapistImage,
          fromBundle
            ? { date: selection.date, slot: selection.slot, source: SLEEP_PLAN_BUNDLE_SOURCE }
            : { date: selection.date, slot: selection.slot },
        );
        if (fromBundle) await addBundleNonTherapyItems();
        await refreshCart();
        const goToCheckout = flow === 'plan-start' || (flow === 'standalone' && action === 'book');
        if (goToCheckout) {
          router.push('/checkout');
          return;
        }
        toast.success(fromBundle ? 'Your sleep plan was added to cart' : 'Therapy session added to cart');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not add to cart');
      } finally {
        setAdding(null);
      }
    },
    [therapyFlow, addBundleNonTherapyItems, refreshCart, router, setAdding, closeTherapistModal],
  );

  const resetTherapyFlow = useCallback(() => setTherapyFlow('standalone'), []);

  return {
    bundleItems,
    selectedItems,
    selectedCount,
    toggleItem,
    showBundle,
    showTherapy,
    pricing,
    handleStartPlan,
    handleAddPlanToCart,
    handleTherapyConfirm,
    resetTherapyFlow,
  };
}
