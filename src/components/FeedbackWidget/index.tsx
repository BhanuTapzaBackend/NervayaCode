'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useFloatingActions } from '@/context/FloatingActionsContext';
import { ROLES } from '@/lib/constants/roles';
import { feedbackApi } from '@/lib/api/feedback';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { toast } from 'sonner';
import styles from './styles.module.css';

const FEEDBACK_GIVEN_KEY = 'nervaya_feedback_given';

function getInitialFeedbackState(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(FEEDBACK_GIVEN_KEY) === 'true';
}

type WidgetState = 'idle' | 'open' | 'submitting' | 'success';

export function FeedbackWidget() {
  const { user } = useAuthContext();
  const { isExpanded, registerButton } = useFloatingActions();
  const [state, setState] = useState<WidgetState>('idle');
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [hasGivenFeedback, setHasGivenFeedback] = useState(getInitialFeedbackState);
  const modalRef = useRef<HTMLDivElement>(null);

  const isCustomer = user?.role === ROLES.CUSTOMER;
  const showFloatingButton = isCustomer && state === 'idle' && !hasGivenFeedback;

  useEffect(() => {
    if (!showFloatingButton) return;
    return registerButton();
  }, [showFloatingButton, registerButton]);

  const handleOpen = useCallback(() => {
    setState('open');
    setScore(null);
    setComment('');
  }, []);

  const handleClose = useCallback(() => {
    setState('idle');
  }, []);

  useModalDismiss(state === 'open' || state === 'submitting' || state === 'success', modalRef, handleClose);

  const handleSubmit = useCallback(async () => {
    if (score === null) return;
    setState('submitting');
    try {
      await feedbackApi.submit({
        score,
        comment: comment.trim() || undefined,
        pageUrl: window.location.pathname,
      });
      localStorage.setItem(FEEDBACK_GIVEN_KEY, 'true');
      setHasGivenFeedback(true);
      setState('success');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      toast.error('Failed to submit feedback. Please try again.');
      setState('open');
    }
  }, [score, comment]);

  useEffect(() => {
    const handler = () => handleOpen();
    window.addEventListener('open-feedback-widget', handler);
    return () => window.removeEventListener('open-feedback-widget', handler);
  }, [handleOpen]);

  if (!isCustomer) return null;

  return (
    <>
      {showFloatingButton && (
        <button
          className={`${styles.floatingButton} ${!isExpanded ? styles.collapsed : ''}`}
          onClick={handleOpen}
          aria-label="Share feedback"
          aria-hidden={!isExpanded}
          tabIndex={!isExpanded ? -1 : undefined}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Feedback</span>
        </button>
      )}

      {(state === 'open' || state === 'submitting' || state === 'success') && (
        <div className={styles.overlay}>
          <div ref={modalRef} className={styles.modal} role="dialog" aria-modal="true">
            {state === 'success' ? (
              <div className={styles.successContent}>
                <div className={styles.successIcon}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3 className={styles.successTitle}>Thank you for your feedback!</h3>
                <p className={styles.successText}>Your response helps us improve our services.</p>
              </div>
            ) : (
              <>
                <div className={styles.header}>
                  <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <h3 className={styles.headerTitle}>Share Your Feedback</h3>
                  </div>
                  <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className={styles.body}>
                  <p className={styles.question}>How likely are you to recommend us to a friend or colleague?</p>
                  <div className={styles.npsRow}>
                    {Array.from({ length: 11 }, (_, i) => (
                      <button
                        key={i}
                        className={`${styles.npsButton} ${score === i ? styles.npsSelected : ''}`}
                        onClick={() => setScore(i)}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  <div className={styles.npsLabels}>
                    <span>Not likely at all</span>
                    <span>Extremely likely</span>
                  </div>

                  <label className={styles.textareaLabel}>Tell us more about your experience</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Share your thoughts, suggestions, or any issues you've encountered..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={1000}
                    rows={4}
                  />
                  <p className={styles.helperText}>Your feedback helps us improve our services and better serve you.</p>
                </div>

                <div className={styles.footer}>
                  <button className={styles.cancelButton} onClick={handleClose} disabled={state === 'submitting'}>
                    Cancel
                  </button>
                  <button
                    className={styles.submitButton}
                    onClick={handleSubmit}
                    disabled={score === null || state === 'submitting'}
                  >
                    {state === 'submitting' ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
