'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ICON_ALERT, ICON_DOCUMENT } from '@/constants/icons';
import Sidebar from '@/components/Sidebar/LazySidebar';
import AssessmentContainer from '@/components/SleepAssessment/AssessmentContainer';
import { GlobalLoader } from '@/components/common';
import PageHeader from '@/components/PageHeader/PageHeader';
import styles from './styles.module.css';
import axiosInstance from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';
import type { ISleepAssessmentQuestion } from '@/types/sleepAssessment.types';
import type { ApiResponse } from '@/lib/utils/response.util';

export default function SleepAssessmentPage() {
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const [questions, setQuestions] = useState<ISleepAssessmentQuestion[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isContainerHydrated, setIsContainerHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axiosInstance.get<unknown, ApiResponse<ISleepAssessmentQuestion[]>>(
          '/sleep-assessment/questions',
        );
        if (response.success) {
          setQuestions(response.data || []);
        } else {
          setError('Failed to load questions');
        }
      } catch {
        setError('Failed to load assessment questions. Please try again later.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchQuestions();
  }, []);
  const showPageLoader = isFetching || (!error && questions.length > 0 && !isContainerHydrated);

  const content = (
    <>
      {showPageLoader && (
        <div className={styles.loadingContainer}>
          <GlobalLoader label="Loading your assessment..." />
        </div>
      )}

      {error && !showPageLoader && (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <Icon icon={ICON_ALERT} aria-hidden />
          </div>
          <p className={styles.errorText}>{error}</p>
          <button type="button" className={styles.retryButton} onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      )}

      {!showPageLoader && !error && questions.length === 0 && (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>
            <Icon icon={ICON_DOCUMENT} aria-hidden />
          </div>
          <h2 className={styles.emptyTitle}>No Questions Available</h2>
          <p className={styles.emptyText}>The sleep assessment is currently being updated. Please check back later.</p>
        </div>
      )}

      {!error && questions.length > 0 && (
        <AssessmentContainer questions={questions} isGuest={isGuest} onHydrated={() => setIsContainerHydrated(true)} />
      )}
    </>
  );

  if (isGuest) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.guestContainer}>{content}</div>
      </div>
    );
  }

  return (
    <Sidebar>
      <div className={styles.pageContainer}>
        <div className={styles.authContainer}>
          <div className={styles.headerSpacer}>
            <PageHeader title="" subtitle="" />
          </div>
          {content}
        </div>
      </div>
    </Sidebar>
  );
}
