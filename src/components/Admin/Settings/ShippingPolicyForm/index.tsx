'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/common';
import { Icon } from '@iconify/react';
import { ICON_INFO } from '@/constants/icons';
import { toast } from 'sonner';
import styles from './styles.module.css';

const MAX_CHARS = 600;
const MAX_LINES = 10;

const ShippingPolicyForm = () => {
  const [policy, setPolicy] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/config');
      const result = await response.json();

      if (result.success) {
        const shippingConfig = result.data.find((c: { key: string; value: unknown }) => c.key === 'shipping_policy');
        if (shippingConfig) {
          setPolicy(shippingConfig.value);
        }
      }
    } catch {
      console.error('Failed to fetch shipping policy');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const lineCount = policy.split('\n').length;
    if (policy.length > MAX_CHARS) {
      toast.error(`Policy exceeds maximum of ${MAX_CHARS} characters`);
      return;
    }
    if (lineCount > MAX_LINES) {
      toast.error(`Policy exceeds maximum of ${MAX_LINES} lines`);
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'shipping_policy',
          value: policy,
          isPublic: true,
          description: 'Global Shipping & Delivery Policy displayed on supplement pages',
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Shipping policy updated successfully');
      } else {
        toast.error(result.message || 'Failed to update policy');
      }
    } catch {
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const lineCount = policy.split('\n').filter((l) => l.trim().length > 0 || l.length > 0).length;
  const isOverLimit = policy.length > MAX_CHARS || lineCount > MAX_LINES;

  if (loading) {
    return <div className={styles.loading}>Loading settings...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Shipping & Delivery Settings</h1>
          <p className={styles.subtitle}>Configure the global shipping information shown to customers.</p>
        </div>
        <Button variant="primary" onClick={handleSave} loading={saving} disabled={isOverLimit}>
          Save Changes
        </Button>
      </div>

      <div className={styles.card}>
        <div className={styles.fieldHeader}>
          <label className={styles.label}>
            Global Shipping Policy
            <div className={styles.tooltipRoot}>
              <Icon icon={ICON_INFO} className={styles.infoIcon} />
              <span className={styles.tooltipText}>
                This text will appear in the &quot;Shipping & Delivery&quot; tab for all supplements.
              </span>
            </div>
          </label>
          <div className={styles.counters}>
            <span className={`${styles.counter} ${policy.length > MAX_CHARS ? styles.counterError : ''}`}>
              {policy.length} / {MAX_CHARS} chars
            </span>
            <span className={`${styles.counter} ${lineCount > MAX_LINES ? styles.counterError : ''}`}>
              {lineCount} / {MAX_LINES} lines
            </span>
          </div>
        </div>

        <textarea
          className={`${styles.textarea} ${isOverLimit ? styles.textareaError : ''}`}
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
          placeholder="Enter shipping and delivery information..."
          rows={12}
        />

        <div className={styles.helpBox}>
          <h4 className={styles.helpTitle}>
            <Icon icon={ICON_INFO} /> Usage Tips
          </h4>
          <ul className={styles.helpList}>
            <li>Use clear, concise language.</li>
            <li>Each new line creates a visual break.</li>
            <li>Mention processing times and estimated delivery windows.</li>
            <li>Include contact information for support.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicyForm;
