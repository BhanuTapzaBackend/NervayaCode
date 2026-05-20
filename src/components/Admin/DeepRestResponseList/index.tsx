'use client';

import { useState, useMemo } from 'react';
import DeepRestAssignVideoModal from '@/components/Admin/DeepRestAssignVideoModal';
import Pagination from '@/components/common/Pagination';
import UserSessionGroup from './UserSessionGroup';
import type { IDeepRestResponse } from '@/types/deepRest.types';
import type { ISleepAssessmentQuestion } from '@/types/sleepAssessment.types';
import styles from './styles.module.css';

interface DeepRestResponseListProps {
  responses: IDeepRestResponse[];
  questions: ISleepAssessmentQuestion[];
  onAssign: (responseId: string, videoUrl: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 10;

function hasPendingReSessionRequest(response: IDeepRestResponse): boolean {
  return Boolean(response.reSessionRequestedAt && !response.reSessionResolvedAt);
}

const DeepRestResponseList = ({ responses, questions, onAssign }: DeepRestResponseListProps) => {
  const [activeResponseId, setActiveResponseId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const activeResponse = activeResponseId ? responses.find((r) => r._id === activeResponseId) : null;

  const getQuestionText = (questionId: string) => {
    const question = questions.find((q) => q._id === questionId);
    return question?.questionText || `Question ${questionId}`;
  };

  const formatAnswer = (answer: string | string[]) => {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return answer;
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Group responses by User
  const groupedResponses = useMemo(() => {
    const groups = new Map<string, IDeepRestResponse[]>();
    responses.forEach((response) => {
      const uid = response.userId;
      if (!groups.has(uid)) {
        groups.set(uid, []);
      }
      groups.get(uid)?.push(response);
    });

    // Sort users by their most recent response date
    return Array.from(groups.entries()).sort((a: [string, IDeepRestResponse[]], b: [string, IDeepRestResponse[]]) => {
      const pendingA = a[1].some(hasPendingReSessionRequest);
      const pendingB = b[1].some(hasPendingReSessionRequest);
      if (pendingA !== pendingB) {
        return pendingA ? -1 : 1;
      }

      const latestA = Math.max(...a[1].map((r: IDeepRestResponse) => new Date(r.createdAt).getTime()));
      const latestB = Math.max(...b[1].map((r: IDeepRestResponse) => new Date(r.createdAt).getTime()));
      return latestB - latestA;
    });
  }, [responses]);

  const totalPages = Math.ceil(groupedResponses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const totalGroups = groupedResponses.length;
  const currentGroups = groupedResponses.slice(startIndex, endIndex);

  return (
    <>
      <div className={styles.list} aria-label="Deep Rest responses">
        {currentGroups.length > 0 ? (
          currentGroups.map(([uid, userResponses]: [string, IDeepRestResponse[]]) => (
            <UserSessionGroup
              key={uid}
              userResponses={userResponses}
              questions={questions}
              onAssignToResponse={setActiveResponseId}
              getQuestionText={getQuestionText}
              formatAnswer={formatAnswer}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>No Deep Rest responses yet.</p>
          </div>
        )}
      </div>

      <Pagination
        page={currentPage}
        limit={ITEMS_PER_PAGE}
        total={totalGroups}
        totalPages={totalPages}
        onPageChange={goToPage}
        ariaLabel="Deep Rest responses pagination"
      />

      {activeResponse && (
        <DeepRestAssignVideoModal
          responseId={activeResponse._id}
          userId={activeResponse.userId}
          existingVideoUrl={activeResponse.assignedVideoUrl}
          hasPendingReSessionRequest={hasPendingReSessionRequest(activeResponse)}
          onClose={() => setActiveResponseId(null)}
          onAssign={onAssign}
        />
      )}
    </>
  );
};

export default DeepRestResponseList;
