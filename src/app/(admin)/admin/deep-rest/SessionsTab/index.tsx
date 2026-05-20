'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import DeepRestResponseList from '@/components/Admin/DeepRestResponseList';
import { deepRestQuestionsApi } from '@/lib/api/deepRestQuestions';
import { useAdminDeepRestResponses, useAssignDeepRestVideo } from '@/queries/deepRest/useDeepRest';
import type { ISleepAssessmentQuestion } from '@/types/sleepAssessment.types';
import Input from '@/components/common/Input';
import styles from './styles.module.css';

export default function SessionsTab() {
  const { data, isLoading, error, refetch } = useAdminDeepRestResponses();
  const { mutateAsync: assignVideo } = useAssignDeepRestVideo();
  const [responseQuestions, setResponseQuestions] = useState<ISleepAssessmentQuestion[]>([]);
  const [responseQuestionsLoading, setResponseQuestionsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const isLoadingData = isLoading || responseQuestionsLoading;

  const loadResponseQuestions = useCallback(async () => {
    try {
      setResponseQuestionsLoading(true);
      const response = await deepRestQuestionsApi.getQuestions();
      if (response.success) {
        setResponseQuestions((response.data as ISleepAssessmentQuestion[]) || []);
      }
    } catch {
      // non-fatal
    } finally {
      setResponseQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    loadResponseQuestions();
  }, [refetch, loadResponseQuestions]);

  const handleAssign = async (responseId: string, videoUrl: string) => {
    await assignVideo({ responseId, videoUrl });
    await refetch();
  };

  const filteredResponses = useMemo(() => {
    return (data ?? []).filter((r) => {
      // Search Filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const userName = r.user?.name?.toLowerCase() || '';
        const userEmail = r.user?.email?.toLowerCase() || '';
        if (!userName.includes(search) && !userEmail.includes(search)) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchTerm]);

  return (
    <div>
      {isLoadingData ? (
        <GlobalLoader label="Loading sessions..." />
      ) : (
        <>
          {!error && (
            <div className={styles.controlsContainer}>
              <div className={styles.searchWrapper}>
                <Input
                  label="Search Users"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  compact
                  variant="light"
                />
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorState}>
              <p className={styles.errorText}>Failed to load responses.</p>
              <button
                type="button"
                className={styles.retryBtn}
                onClick={() => {
                  refetch();
                  loadResponseQuestions();
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!error && (
            <DeepRestResponseList responses={filteredResponses} questions={responseQuestions} onAssign={handleAssign} />
          )}
        </>
      )}
    </div>
  );
}
