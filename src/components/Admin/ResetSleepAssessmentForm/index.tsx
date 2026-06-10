'use client';

import { useState, type FormEvent } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { Button } from '@/components/common';
import { ICON_INFO, ICON_TRASH } from '@/constants/icons';
import { normalizePhone, validatePhone } from '@/lib/utils/validation.util';
import styles from './styles.module.css';

interface ResetResponse {
  success: boolean;
  message?: string;
  data?: { deletedCount: number; userPhone: string };
}

const ResetSleepAssessmentForm = () => {
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const performReset = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/sleep-assessment/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const json = (await res.json()) as ResetResponse;
      if (!res.ok || !json.success) {
        toast.error(json.message || 'Failed to reset the assessment');
        return;
      }
      toast.success(json.message || 'Assessment reset successfully');
      setPhone('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error while resetting');
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const rawPhone = phone.trim();
    if (!rawPhone) {
      toast.error('Enter the user phone number to reset');
      return;
    }
    const normalized = normalizePhone(rawPhone);
    if (!normalized || !validatePhone(normalized)) {
      toast.error('Invalid phone number format. Please enter a valid 10-digit number.');
      return;
    }
    setPhone(normalized); // Set to normalized E.164 string
    setConfirming(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reset Sleep Assessment</h1>
        <p className={styles.subtitle}>
          Removes every saved sleep-assessment response for the specified user so they can retake the assessment from
          scratch. This action cannot be undone.
        </p>
      </header>

      <form className={styles.card} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="reset-phone">
          User Phone Number
        </label>
        <input
          id="reset-phone"
          type="tel"
          className={styles.input}
          placeholder="+919876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          required
        />
        <p className={styles.help}>
          <Icon icon={ICON_INFO} aria-hidden className={styles.helpIcon} />
          The user&apos;s phone number is matched exactly. All sleep-assessment response documents tied to that account
          will be deleted.
        </p>

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="destructive"
            size="md"
            fullWidth={false}
            loading={submitting}
            disabled={submitting}
          >
            <Icon icon={ICON_TRASH} aria-hidden /> Reset Assessment
          </Button>
        </div>
      </form>

      {confirming && (
        <div className={styles.confirmOverlay} role="dialog" aria-modal="true" aria-label="Confirm reset">
          <div className={styles.confirmCard}>
            <h2 className={styles.confirmTitle}>Reset assessment for {phone.trim()}?</h2>
            <p className={styles.confirmBody}>
              All stored sleep-assessment responses for this user will be permanently deleted. The user will see the
              questionnaire from the beginning the next time they visit the page.
            </p>
            <div className={styles.confirmActions}>
              <Button variant="secondary" size="md" fullWidth={false} onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="md" fullWidth={false} loading={submitting} onClick={performReset}>
                Yes, reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetSleepAssessmentForm;
