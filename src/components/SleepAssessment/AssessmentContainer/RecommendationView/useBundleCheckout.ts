'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { type AssessmentResult, type ServiceKey, getBundleItems, getTherapyPriority } from '@/utils/sleepAssessment';
import { cartApi } from '@/lib/api/cart';
import { useAuth } from '@/hooks/useAuth';
import { sleepPlanApi, type PlanPricing, type PlanServiceKey } from '@/lib/api/sleepPlan';
import { ITEM_TYPE } from '@/lib/constants/enums';
import { DRIFT_OFF_SESSION_IMAGE } from '@/lib/constants/driftOff.constants';
import {
  SLEEP_PLAN_BUNDLE_SOURCE,
  THERAPIST_RECOMMENDATION_MODAL_ENABLED,
  THERAPY_CORNER_PATH,
} from '@/lib/constants/sleepPlan.constants';
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
  startTherapySelection: () => void;
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
  const { user } = useAuth();
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

  // Priced by the server, from the same function that prices the order, so the
  // number shown here cannot drift from the number charged. The local sum is
  // only a placeholder while the quote is in flight.
  const [quote, setQuote] = useState<PlanPricing | null>(null);

  useEffect(() => {
    let active = true;
    if (selectedItems.length === 0) {
      setQuote(null);
      return;
    }
    sleepPlanApi
      .getQuote(selectedItems as PlanServiceKey[])
      .then((res) => {
        if (active && res.success && res.data) setQuote(res.data);
      })
      .catch(() => {
        if (active) setQuote(null);
      });
    return () => {
      active = false;
    };
  }, [selectedItems]);

  const pricing = useMemo(() => {
    const localSubtotal = selectedItems.reduce((sum, key) => sum + itemUnitPrice(key), 0);
    if (!quote) {
      return { originalPrice: localSubtotal, discountedPrice: localSubtotal, savingsAmount: 0 };
    }
    return {
      originalPrice: quote.subtotal,
      discountedPrice: quote.total,
      savingsAmount: quote.discountAmount,
    };
  }, [quote, selectedItems, itemUnitPrice]);

  /**
   * Takes an existing pending order through payment.
   *
   * Mirrors the direct-booking flow: create the Razorpay order, honour the test
   * customer's bypass, otherwise open the checkout and verify on success.
   */
  const payForOrder = useCallback(
    async (orderId: string, amount: number) => {
      const rzpRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount }),
      });
      const rzpData = await rzpRes.json();
      if (!rzpRes.ok || !rzpData.success) throw new Error(rzpData.message || 'Failed to initialize payment');

      if (rzpData.data?.bypassed) {
        router.push(`/order-success/${orderId}`);
        return;
      }
      if (!window.Razorpay) throw new Error('Payment gateway not loaded. Please try again.');

      const rzp = new window.Razorpay({
        key: rzpData.data.key_id,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'Nervaya',
        description: 'Your personalised sleep plan',
        order_id: rzpData.data.id,
        prefill: { name: user?.name ?? '', email: user?.email ?? '', contact: user?.phone ?? '' },
        theme: { color: 'var(--color-accent)' },
        handler: async (response: { razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              paymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            router.push(`/order-success/${orderId}`);
          } else {
            toast.error(verifyData.message || 'Payment verification failed');
            setAdding(null);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled — your slot is held for a few more minutes.');
            setAdding(null);
          },
        },
      });
      rzp.open();
    },
    [router, setAdding, user],
  );

  /** Buys the plan as one server-priced order, holding the therapy slot first. */
  const purchasePlan = useCallback(
    async (therapy?: { therapistId: string; date: string; slot: string }) => {
      try {
        const res = await sleepPlanApi.checkout({ services: selectedItems as PlanServiceKey[], therapy });
        if (!res.success || !res.data) throw new Error(res.message || 'Could not start your plan');
        const { order } = res.data;
        await payForOrder(String(order._id), order.totalAmount);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not start your plan');
        setAdding(null);
      }
    },
    [selectedItems, payForOrder, setAdding],
  );

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

  // Modal paused: park the rest of the plan in the cart, then let the user pick a therapist
  // on /therapy-corner and book the session from there.
  const addBundleAndPickTherapist = useCallback(async () => {
    const hasOtherItems = selectedItems.some((key) => key !== 'THERAPY');
    try {
      await addBundleNonTherapyItems();
      if (hasOtherItems) {
        await refreshCart();
        toast.success('Your plan is in the cart — now pick the therapist for your session.');
      }
      router.push(THERAPY_CORNER_PATH);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add plan to cart');
      setAdding(null);
    }
  }, [selectedItems, addBundleNonTherapyItems, refreshCart, router, setAdding]);

  const handleStartPlan = useCallback(async () => {
    if (!showBundle) return;
    setAdding('plan');
    if (selectedHasTherapy) {
      // The package is one payment, so the slot has to be chosen and held
      // BEFORE paying — hence the modal here regardless of
      // THERAPIST_RECOMMENDATION_MODAL_ENABLED, which governs the standalone
      // therapy CTAs that deliberately send people to Therapy Corner.
      setTherapyFlow('plan-start');
      openTherapistModal();
      return;
    }
    await purchasePlan();
  }, [showBundle, selectedHasTherapy, purchasePlan, setAdding, openTherapistModal]);

  const handleAddPlanToCart = useCallback(async () => {
    if (!showBundle) return;
    if (selectedHasTherapy) {
      setAdding('cart');
      if (!THERAPIST_RECOMMENDATION_MODAL_ENABLED) {
        await addBundleAndPickTherapist();
        return;
      }
      setTherapyFlow('plan-cart');
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
  }, [
    showBundle,
    selectedHasTherapy,
    addBundleNonTherapyItems,
    addBundleAndPickTherapist,
    refreshCart,
    setAdding,
    openTherapistModal,
  ]);

  const handleTherapyConfirm = useCallback(
    async (selection: TherapistSelection, action: TherapyAction) => {
      closeTherapistModal();
      const flow = therapyFlow;
      setTherapyFlow('standalone');
      const fromBundle = flow === 'plan-start' || flow === 'plan-cart';
      if (fromBundle) {
        // One server-priced order for the whole plan, therapy included.
        await purchasePlan({ therapistId: selection.therapistId, date: selection.date, slot: selection.slot });
        return;
      }
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
        // Only the standalone flow reaches here; the package returned above.
        if (action === 'book') {
          router.push('/checkout');
          return;
        }
        toast.success('Therapy session added to cart');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not add to cart');
      } finally {
        setAdding(null);
      }
    },
    [therapyFlow, purchasePlan, refreshCart, router, setAdding, closeTherapistModal],
  );

  // Single entry point for the standalone therapy CTAs (highlight card + individual module tile).
  const startTherapySelection = useCallback(() => {
    if (!THERAPIST_RECOMMENDATION_MODAL_ENABLED) {
      router.push(THERAPY_CORNER_PATH);
      return;
    }
    setTherapyFlow('standalone');
    openTherapistModal();
  }, [router, openTherapistModal]);

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
    startTherapySelection,
    resetTherapyFlow,
  };
}
