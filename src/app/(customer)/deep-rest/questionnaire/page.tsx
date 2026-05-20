'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/LazySidebar';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import Button from '@/components/common/Button';
import DriftOffAssessmentContainer from '@/components/DeepRest/DriftOffAssessmentContainer';
import axiosInstance from '@/lib/axios';
import type { ISleepAssessmentQuestion } from '@/types/sleepAssessment.types';
import type { ApiResponse } from '@/lib/utils/response.util';
import type { IDriftOffAnswer, IDriftOffOrder } from '@/types/driftOff.types';
import styles from './styles.module.css';

export default function DriftOffQuestionnairePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [questions, setQuestions] = useState<ISleepAssessmentQuestion[]>([]);
  const [initialAnswers, setInitialAnswers] = useState<IDriftOffAnswer[]>([]);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const hasCheckedRedirectsRef = useRef(false);

  // We no longer use global showLoader() here to keep it 'inside the page'

  const fetchQuestionsWithRetry = useCallback(async (): Promise<ISleepAssessmentQuestion[]> => {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const questionsRes = await axiosInstance.get<unknown, ApiResponse<ISleepAssessmentQuestion[]>>(
        '/deep-rest/questions',
      );

      if (!questionsRes.success) {
        if (attempt === maxAttempts) {
          throw new Error('Failed to load questionnaire questions');
        }
      } else {
        const nextQuestions = questionsRes.data || [];
        if (nextQuestions.length > 0) {
          return nextQuestions;
        }
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    return [];
  }, []);

  const loadOrderData = useCallback(
    async (orderIdToLoad: string) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        const orderRes = await axiosInstance.get<unknown, ApiResponse<IDriftOffOrder>>(
          `/deep-rest/orders/${orderIdToLoad}`,
        );

        if (!orderRes.success || !orderRes.data) {
          setError('Failed to load order information');
          setIsLoading(false);
          return;
        }
        if (orderRes.data.paymentStatus !== 'paid') {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const retryOrderRes = await axiosInstance.get<unknown, ApiResponse<IDriftOffOrder>>(
            `/deep-rest/orders/${orderIdToLoad}`,
          );

          if (retryOrderRes.success && retryOrderRes.data?.paymentStatus === 'paid') {
          } else {
            setError('Payment verification in progress. Please wait a moment and refresh.');
            setIsLoading(false);
            return;
          }
        }

        try {
          const responseRes = await axiosInstance.get<
            unknown,
            ApiResponse<{
              _id: string;
              completedAt?: string;
              answers?: IDriftOffAnswer[];
              reSessionRequestedAt?: string | null;
            }>
          >(`/deep-rest/responses/order/${orderIdToLoad}`);

          const isReSessionMode = searchParams.get('mode') === 're-session';

          if (responseRes.success && responseRes.data?.completedAt && !isReSessionMode) {
            hasCheckedRedirectsRef.current = true;
            router.replace('/deep-rest/sessions');
            return;
          }

          if (responseRes.success && responseRes.data?.reSessionRequestedAt && isReSessionMode) {
            hasCheckedRedirectsRef.current = true;
            router.replace('/deep-rest/sessions');
            return;
          }

          setInitialAnswers(responseRes.data?.answers || []);
          setResponseId(responseRes.data?._id || null);
        } catch {
          setInitialAnswers([]);
          setResponseId(null);
        }
        hasCheckedRedirectsRef.current = true;

        const loadedQuestions = await fetchQuestionsWithRetry();
        if (loadedQuestions.length === 0) {
          setError('Unable to load questionnaire questions right now. Please try again in a few seconds.');
          return;
        }

        setQuestions(loadedQuestions);
      } catch {
        setError('Failed to load the questionnaire. Please try again.');
      } finally {
        setIsLoading(false);
        setIsRedirecting(false);
      }
    },
    [router, fetchQuestionsWithRetry, searchParams],
  );

  const loadData = useCallback(async () => {
    const url = window.location.href;
    if (isRedirecting) {
      return;
    }

    if (!orderId) {
      if (hasCheckedRedirectsRef.current) {
        setError('No order found. Please start from the beginning.');
        setIsLoading(false);
        return;
      }

      setIsRedirecting(true);
      hasCheckedRedirectsRef.current = true;
      try {
        const ordersRes = await axiosInstance.get<unknown, ApiResponse<IDriftOffOrder[]>>('/deep-rest/orders');

        if (ordersRes.success && ordersRes.data) {
          const paidOrder = ordersRes.data.find((order) => order.paymentStatus === 'paid');
          if (paidOrder) {
            const newUrl = `/deep-rest/questionnaire?orderId=${paidOrder._id}`;
            if (url.includes(`orderId=${paidOrder._id}`)) {
              return await loadOrderData(paidOrder._id);
            }

            router.replace(newUrl);
            return;
          }
        }
      } catch {}

      router.replace('/deep-rest/payment');
      return;
    }
    await loadOrderData(orderId);
  }, [isRedirecting, router, orderId, loadOrderData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Sidebar>
      <div className={styles.wrapper}>
        {isLoading && <GlobalLoader label="Preparing your questionnaire..." />}

        {!isLoading && error && (
          <div className={styles.error}>
            <div className={styles.errorContent}>
              <h3 className={styles.errorTitle}>Unable to Load Questionnaire</h3>
              <p className={styles.errorMessage}>{error}</p>
              <div className={styles.errorActions}>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth={false}
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  fullWidth={false}
                  onClick={() => router.replace('/deep-rest/payment')}
                >
                  Back to Payment
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && orderId && questions.length > 0 && (
          <DriftOffAssessmentContainer
            questions={questions}
            driftOffOrderId={orderId}
            initialAnswers={initialAnswers}
            responseId={responseId}
            isReSession={searchParams.get('mode') === 're-session'}
          />
        )}
      </div>
    </Sidebar>
  );
}
