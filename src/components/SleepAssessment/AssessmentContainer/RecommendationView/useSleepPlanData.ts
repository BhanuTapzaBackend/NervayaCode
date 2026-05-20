'use client';

import { useEffect, useState } from 'react';
import { configApi } from '@/lib/api/config';
import { supplementsApi } from '@/lib/api/supplements';
import type { Supplement } from '@/types/supplement.types';
import {
  SLEEP_BUNDLE_DISCOUNT_KEY,
  SLEEP_BUNDLE_DISCOUNT_MIN,
  SLEEP_BUNDLE_DISCOUNT_MAX,
  THERAPY_STARTING_PRICE_KEY,
  DEEP_REST_RECOMMENDATION_PRICE_KEY,
  SUPPLEMENT_RECOMMENDATION_PRICE_KEY,
} from '@/lib/constants/sleepPlan.constants';

export interface SleepPlanData {
  supplement: Supplement | null;
  deepRestPrice: number;
  therapyPrice: number;
  discountPct: number;
  loading: boolean;
  error: string | null;
  /**
   * False only when the admin pricing config is missing/invalid. The "no active
   * supplement" case keeps this true so Therapy / Deep Rest stay available.
   */
  pricingConfigured: boolean;
}

const PRICING_NOT_CONFIGURED_ERROR = 'Sleep plan pricing is not available right now. Please try again later.';

function pickFeaturedSupplement(items: Supplement[]): Supplement | null {
  const active = items.filter((s) => s.isActive && s.stock > 0);
  if (active.length === 0) return null;
  return [...active].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

/** Returns the configured price only when it is a finite, strictly-positive
 *  number. No fallback — `null` signals the admin has not configured it. */
function readConfiguredPrice(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Returns the configured discount only when within the allowed bounds. */
function readConfiguredDiscount(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < SLEEP_BUNDLE_DISCOUNT_MIN || n > SLEEP_BUNDLE_DISCOUNT_MAX) return null;
  return n;
}

export function useSleepPlanData(): SleepPlanData {
  const [data, setData] = useState<SleepPlanData>({
    supplement: null,
    deepRestPrice: 0,
    therapyPrice: 0,
    discountPct: 0,
    loading: true,
    error: null,
    pricingConfigured: true,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [configRes, suppRes] = await Promise.all([configApi.getPublic(), supplementsApi.getAll()]);
        if (!active) return;

        const configMap = configRes.success && configRes.data ? configRes.data : {};
        const rawSupplement = suppRes.success && suppRes.data ? pickFeaturedSupplement(suppRes.data) : null;

        const therapyPrice = readConfiguredPrice(configMap[THERAPY_STARTING_PRICE_KEY]);
        const deepRestPrice = readConfiguredPrice(configMap[DEEP_REST_RECOMMENDATION_PRICE_KEY]);
        const supplementPrice = readConfiguredPrice(configMap[SUPPLEMENT_RECOMMENDATION_PRICE_KEY]);
        const discountPct = readConfiguredDiscount(configMap[SLEEP_BUNDLE_DISCOUNT_KEY]);

        if (therapyPrice === null || deepRestPrice === null || supplementPrice === null || discountPct === null) {
          setData({
            supplement: null,
            deepRestPrice: 0,
            therapyPrice: 0,
            discountPct: 0,
            loading: false,
            error: PRICING_NOT_CONFIGURED_ERROR,
            pricingConfigured: false,
          });
          return;
        }

        const supplement = rawSupplement ? { ...rawSupplement, price: supplementPrice } : null;

        setData({
          supplement,
          deepRestPrice,
          therapyPrice,
          discountPct,
          loading: false,
          error: supplement ? null : 'No active supplements available',
          pricingConfigured: true,
        });
      } catch (err) {
        if (!active) return;
        setData({
          supplement: null,
          deepRestPrice: 0,
          therapyPrice: 0,
          discountPct: 0,
          loading: false,
          error: err instanceof Error ? err.message : PRICING_NOT_CONFIGURED_ERROR,
          pricingConfigured: false,
        });
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return data;
}
