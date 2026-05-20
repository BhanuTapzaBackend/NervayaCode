'use client';

import React, { useState } from 'react';
import type { CreatePromoCodeDto, PromoCode } from '@/types/supplement.types';
import { Button } from '@/components/common';
import styles from './styles.module.css';

interface FormData {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit?: number;
  description?: string;
  isActive?: boolean;
}

interface PromoCodeFormProps {
  onSubmit: (data: CreatePromoCodeDto) => Promise<void>;
  initialData?: Partial<PromoCode> | null;
  loading?: boolean;
  submitLabel?: string;
}

function toDateLocal(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const PromoCodeForm: React.FC<PromoCodeFormProps> = ({
  onSubmit,
  initialData,
  loading = false,
  submitLabel = 'Create Promo Code',
}) => {
  const [formData, setFormData] = useState<FormData>({
    code: initialData?.code ?? '',
    discountType: initialData?.discountType ?? 'percentage',
    discountValue: initialData?.discountValue ?? 0,
    minPurchase: initialData?.minPurchase ?? undefined,
    maxDiscount: initialData?.maxDiscount ?? undefined,
    expiryDate: initialData?.expiryDate ? toDateLocal(initialData.expiryDate) : '',
    usageLimit: initialData?.usageLimit ?? undefined,
    description: initialData?.description ?? '',
    isActive: initialData?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    const code = String(formData.code).trim().toUpperCase();
    if (!code) newErrors.code = 'Code is required';
    if (formData.discountValue == null || formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    }
    if (formData.discountType === 'percentage') {
      if (formData.maxDiscount == null || formData.maxDiscount <= 0) {
        newErrors.maxDiscount = 'Max discount is required for percentage';
      }
    }
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const expiry = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiry < today) newErrors.expiryDate = 'Expiry date must be in the future';
    }
    if (formData.usageLimit != null && formData.usageLimit < 1) {
      newErrors.usageLimit = 'Usage limit must be at least 1';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: CreatePromoCodeDto = {
      code: String(formData.code).trim().toUpperCase(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      ...(formData.minPurchase != null && formData.minPurchase > 0 && { minPurchase: formData.minPurchase }),
      ...(formData.maxDiscount != null && formData.maxDiscount > 0 && { maxDiscount: formData.maxDiscount }),
      expiryDate: new Date(formData.expiryDate).toISOString(),
      ...(formData.usageLimit != null && formData.usageLimit > 0 && { usageLimit: formData.usageLimit }),
      ...(formData.description?.trim() && { description: formData.description.trim() }),
      isActive: formData.isActive ?? true,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="promo-code" className={styles.label}>
            Code
          </label>
          <input
            id="promo-code"
            type="text"
            value={formData.code}
            onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            className={styles.input}
            placeholder="e.g. SAVE10"
            disabled={!!initialData?._id}
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? 'promo-code-error' : undefined}
          />
          {errors.code && (
            <span id="promo-code-error" className={styles.errorText} role="alert">
              {errors.code}
            </span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>Discount Type</span>
          <div className={styles.radioGroup} role="group" aria-label="Discount type">
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="discountType"
                checked={formData.discountType === 'percentage'}
                onChange={() => setFormData((p) => ({ ...p, discountType: 'percentage' }))}
                className={styles.radio}
              />
              Percentage
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="discountType"
                checked={formData.discountType === 'fixed'}
                onChange={() => setFormData((p) => ({ ...p, discountType: 'fixed' }))}
                className={styles.radio}
              />
              Fixed
            </label>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="promo-value" className={styles.label}>
            Discount Value {formData.discountType === 'percentage' ? '(%)' : '(₹)'}
          </label>
          <input
            id="promo-value"
            type="number"
            min="0"
            step={formData.discountType === 'percentage' ? 1 : 0.01}
            value={formData.discountValue || ''}
            onChange={(e) => setFormData((p) => ({ ...p, discountValue: Number(e.target.value) || 0 }))}
            className={styles.input}
            aria-invalid={!!errors.discountValue}
          />
          {errors.discountValue && (
            <span className={styles.errorText} role="alert">
              {errors.discountValue}
            </span>
          )}
        </div>

        {formData.discountType === 'percentage' && (
          <div className={styles.fieldGroup}>
            <label htmlFor="promo-max" className={styles.label}>
              Max Discount (₹)
            </label>
            <input
              id="promo-max"
              type="number"
              min="0"
              value={formData.maxDiscount ?? ''}
              onChange={(e) =>
                setFormData((p) => ({ ...p, maxDiscount: e.target.value ? Number(e.target.value) : undefined }))
              }
              className={styles.input}
              aria-invalid={!!errors.maxDiscount}
            />
            {errors.maxDiscount && (
              <span className={styles.errorText} role="alert">
                {errors.maxDiscount}
              </span>
            )}
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="promo-min" className={styles.label}>
            Min Purchase (₹, optional)
          </label>
          <input
            id="promo-min"
            type="number"
            min="0"
            value={formData.minPurchase ?? ''}
            onChange={(e) =>
              setFormData((p) => ({ ...p, minPurchase: e.target.value ? Number(e.target.value) : undefined }))
            }
            className={styles.input}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="promo-limit" className={styles.label}>
            Usage Limit (optional)
          </label>
          <input
            id="promo-limit"
            type="number"
            min="1"
            value={formData.usageLimit ?? ''}
            onChange={(e) =>
              setFormData((p) => ({ ...p, usageLimit: e.target.value ? Number(e.target.value) : undefined }))
            }
            className={styles.input}
            aria-invalid={!!errors.usageLimit}
          />
          {errors.usageLimit && (
            <span className={styles.errorText} role="alert">
              {errors.usageLimit}
            </span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="promo-expiry" className={styles.label}>
            Expiry Date
          </label>
          <input
            id="promo-expiry"
            type="date"
            value={formData.expiryDate ?? ''}
            onChange={(e) => setFormData((p) => ({ ...p, expiryDate: e.target.value }))}
            className={styles.input}
            aria-invalid={!!errors.expiryDate}
          />
          {errors.expiryDate && (
            <span className={styles.errorText} role="alert">
              {errors.expiryDate}
            </span>
          )}
        </div>

        <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
          <label htmlFor="promo-desc" className={styles.label}>
            Description (optional)
          </label>
          <textarea
            id="promo-desc"
            value={formData.description ?? ''}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            className={styles.textarea}
            rows={2}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={formData.isActive ?? true}
              onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
              className={styles.checkbox}
              aria-label="Promo code active"
            />
            Active
          </label>
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" loading={loading} className={styles.submitBtn}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default PromoCodeForm;
