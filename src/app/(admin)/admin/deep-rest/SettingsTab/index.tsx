'use client';

import { useState, useEffect } from 'react';
import { configApi } from '@/lib/api/config';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import { Icon } from '@iconify/react';
import { ICON_LOADING, ICON_SAVE_FILLED } from '@/constants/icons';
import type { ISystemConfig } from '@/types/systemConfig.types';
import { DEEP_REST_SESSION_PRICE_CONFIG_KEY } from '@/lib/constants/deepRest.constants';
import styles from './styles.module.css';

export default function SettingsTab() {
  const [price, setPrice] = useState<number>(999);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await configApi.getAll();
      if (res.success && res.data) {
        const priceConfig = res.data.find((config: ISystemConfig) => config.key === DEEP_REST_SESSION_PRICE_CONFIG_KEY);
        if (priceConfig && typeof priceConfig.value === 'number') {
          setPrice(priceConfig.value);
        }
      }
    } catch (_err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (price < 1) {
      setError('Price must be at least ₹1');
      return;
    }
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const res = await configApi.update(
        DEEP_REST_SESSION_PRICE_CONFIG_KEY,
        price,
        true,
        'Deep Rest Session Price (₹)',
      );
      if (res.success) {
        setSuccess('Settings saved successfully');
      }
    } catch (_err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {loading ? (
        <GlobalLoader label="Loading settings..." />
      ) : (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Deep Rest Configuration</h3>
            <p className={styles.cardSubtitle}>Manage global settings for the Deep Rest sessions.</p>
          </div>

          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="price" className={styles.label}>
                Session Price (₹)
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>₹</span>
                <input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className={styles.input}
                  placeholder="999"
                  required
                  min="1"
                />
              </div>
              <p className={styles.helpText}>
                This price will be displayed on the landing page and applied during checkout.
              </p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}

            <div className={styles.formActions}>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? (
                  <>
                    <Icon icon={ICON_LOADING} className={styles.btnIcon} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon icon={ICON_SAVE_FILLED} className={styles.btnIcon} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
