'use client';

import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { Button } from '@/components/common';
import { ICON_INFO } from '@/constants/icons';
import {
  SLEEP_BUNDLE_DISCOUNT_KEY,
  SLEEP_BUNDLE_DISCOUNT_DEFAULT,
  SLEEP_BUNDLE_DISCOUNT_MIN,
  SLEEP_BUNDLE_DISCOUNT_MAX,
  THERAPY_STARTING_PRICE_KEY,
  THERAPY_STARTING_PRICE_DEFAULT,
  DEEP_REST_RECOMMENDATION_PRICE_KEY,
  DEEP_REST_RECOMMENDATION_PRICE_DEFAULT,
  SUPPLEMENT_RECOMMENDATION_PRICE_KEY,
  SUPPLEMENT_RECOMMENDATION_PRICE_DEFAULT,
} from '@/lib/constants/sleepPlan.constants';
import styles from './styles.module.css';

interface AdminConfigRecord {
  key: string;
  value: unknown;
}

const SleepPlanForm = () => {
  const [discountPct, setDiscountPct] = useState<number>(SLEEP_BUNDLE_DISCOUNT_DEFAULT);
  const [therapyPrice, setTherapyPrice] = useState<number>(THERAPY_STARTING_PRICE_DEFAULT);
  const [deepRestPrice, setDeepRestPrice] = useState<number>(DEEP_REST_RECOMMENDATION_PRICE_DEFAULT);
  const [supplementPrice, setSupplementPrice] = useState<number>(SUPPLEMENT_RECOMMENDATION_PRICE_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/admin/config');
        const json = await res.json();
        if (!active || !json.success) return;
        const records: AdminConfigRecord[] = json.data ?? [];
        const discount = records.find((r) => r.key === SLEEP_BUNDLE_DISCOUNT_KEY);
        const price = records.find((r) => r.key === THERAPY_STARTING_PRICE_KEY);
        const deepRest = records.find((r) => r.key === DEEP_REST_RECOMMENDATION_PRICE_KEY);
        const supp = records.find((r) => r.key === SUPPLEMENT_RECOMMENDATION_PRICE_KEY);

        if (typeof discount?.value === 'number') setDiscountPct(discount.value);
        if (typeof price?.value === 'number') setTherapyPrice(price.value);
        if (typeof deepRest?.value === 'number') setDeepRestPrice(deepRest.value);
        if (typeof supp?.value === 'number') setSupplementPrice(supp.value);
      } catch {
        toast.error('Failed to load sleep plan settings');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const isInvalid =
    !Number.isFinite(discountPct) ||
    discountPct < SLEEP_BUNDLE_DISCOUNT_MIN ||
    discountPct > SLEEP_BUNDLE_DISCOUNT_MAX ||
    !Number.isFinite(therapyPrice) ||
    therapyPrice <= 0 ||
    !Number.isFinite(deepRestPrice) ||
    deepRestPrice <= 0 ||
    !Number.isFinite(supplementPrice) ||
    supplementPrice <= 0;

  const handleSave = async () => {
    if (isInvalid) {
      toast.error('Please enter valid values before saving');
      return;
    }
    try {
      setSaving(true);
      const post = async (key: string, value: number, description: string) => {
        const res = await fetch('/api/admin/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value, isPublic: true, description }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to save');
      };
      await post(
        SLEEP_BUNDLE_DISCOUNT_KEY,
        discountPct,
        'Discount % applied to the Sleep Plan bundle (Deep Rest + Supplement [+ Therapy])',
      );
      await post(
        THERAPY_STARTING_PRICE_KEY,
        therapyPrice,
        'Starting therapy session price shown on the recommendation screen',
      );
      await post(
        DEEP_REST_RECOMMENDATION_PRICE_KEY,
        deepRestPrice,
        'Deep Rest program price shown only on the recommendation screen',
      );
      await post(
        SUPPLEMENT_RECOMMENDATION_PRICE_KEY,
        supplementPrice,
        'Supplement price shown only on the recommendation screen',
      );
      toast.success('Sleep plan settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save sleep plan settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading settings...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Sleep Plan Settings</h1>
          <p className={styles.subtitle}>
            Configure the Sleep Plan bundle pricing shown on the post-assessment recommendation screen.
          </p>
        </div>
        <Button variant="primary" onClick={handleSave} loading={saving} disabled={isInvalid}>
          Save Changes
        </Button>
      </div>

      <div className={styles.card}>
        <div className={styles.sectionGroup}>
          <h2 className={styles.sectionTitle}>Bundle Discount Configuration</h2>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="discount-pct">
              Bundle Discount %{' '}
              <span className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>
                  Applied to the sum of Supplement + Deep Rest (+ Therapy if added). Same for every user.
                </span>
              </span>
            </label>
            <input
              id="discount-pct"
              type="number"
              min={SLEEP_BUNDLE_DISCOUNT_MIN}
              max={SLEEP_BUNDLE_DISCOUNT_MAX}
              step={1}
              value={Number.isFinite(discountPct) ? discountPct : ''}
              onChange={(e) => setDiscountPct(e.target.value === '' ? Number.NaN : Number(e.target.value))}
              className={styles.input}
            />
            <p className={styles.help}>
              Must be between {SLEEP_BUNDLE_DISCOUNT_MIN}% and {SLEEP_BUNDLE_DISCOUNT_MAX}%.
            </p>
          </div>
        </div>

        <div className={styles.separator} />

        <div className={styles.sectionGroup}>
          <h2 className={styles.sectionTitle}>Recommendation Screen Pricing Overrides</h2>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="therapy-price">
              Therapy Starting Price (₹){' '}
              <span className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>
                  Used as the default therapy session price shown in the recommendation screen.
                </span>
              </span>
            </label>
            <input
              id="therapy-price"
              type="number"
              min={1}
              step={50}
              value={Number.isFinite(therapyPrice) ? therapyPrice : ''}
              onChange={(e) => setTherapyPrice(e.target.value === '' ? Number.NaN : Number(e.target.value))}
              className={styles.input}
            />
            <p className={styles.help}>Shown for the Therapy Corner option when a therapist hasn’t been chosen yet.</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="deep-rest-price">
              Deep Rest Recommendation Price (₹){' '}
              <span className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>
                  Overrides the Deep Rest price shown and charged on the recommendation screen.
                </span>
              </span>
            </label>
            <input
              id="deep-rest-price"
              type="number"
              min={1}
              step={50}
              value={Number.isFinite(deepRestPrice) ? deepRestPrice : ''}
              onChange={(e) => setDeepRestPrice(e.target.value === '' ? Number.NaN : Number(e.target.value))}
              className={styles.input}
            />
            <p className={styles.help}>Applies only to the post-assessment recommendation screen.</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="supplement-price">
              Supplement Recommendation Price (₹){' '}
              <span className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>
                  Overrides the Supplement price shown and charged on the recommendation screen.
                </span>
              </span>
            </label>
            <input
              id="supplement-price"
              type="number"
              min={1}
              step={50}
              value={Number.isFinite(supplementPrice) ? supplementPrice : ''}
              onChange={(e) => setSupplementPrice(e.target.value === '' ? Number.NaN : Number(e.target.value))}
              className={styles.input}
            />
            <p className={styles.help}>Applies only to the post-assessment recommendation screen.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SleepPlanForm;
