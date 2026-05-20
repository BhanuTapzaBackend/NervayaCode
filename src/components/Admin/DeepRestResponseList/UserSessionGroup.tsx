'use client';

import { useState } from 'react';
import type { IDeepRestResponse } from '@/types/deepRest.types';
import type { ISleepAssessmentQuestion } from '@/types/sleepAssessment.types';
import { Badge } from '@/components/common';
import styles from './styles.module.css';

interface UserSessionGroupProps {
  userResponses: IDeepRestResponse[];
  questions: ISleepAssessmentQuestion[];
  onAssignToResponse: (responseId: string) => void;
  getQuestionText: (questionId: string) => string;
  formatAnswer: (answer: string | string[]) => string;
}

const SESSIONS_PER_PAGE = 1;

const UserSessionGroup = ({
  userResponses,
  questions,
  onAssignToResponse,
  getQuestionText,
  formatAnswer,
}: UserSessionGroupProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());

  const totalSessions = userResponses.length;
  const totalPages = Math.ceil(totalSessions / SESSIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * SESSIONS_PER_PAGE;

  const chronologicalSessions = [...userResponses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const sortedSessions = [...chronologicalSessions].sort((a, b) => {
    const pendingA = Boolean(a.reSessionRequestedAt && !a.reSessionResolvedAt);
    const pendingB = Boolean(b.reSessionRequestedAt && !b.reSessionResolvedAt);
    if (pendingA !== pendingB) {
      return pendingA ? -1 : 1;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const currentSessions = sortedSessions.slice(startIndex, startIndex + SESSIONS_PER_PAGE);

  const toggleExpanded = (responseId: string) => {
    setExpandedResponses((prev) => {
      const next = new Set(prev);
      if (next.has(responseId)) {
        next.delete(responseId);
      } else {
        next.add(responseId);
      }
      return next;
    });
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const userName = userResponses[0]?.user?.name || 'Unknown User';
  const userEmail = userResponses[0]?.user?.email || '';
  const pendingReSessionCount = userResponses.filter(
    (response) => response.reSessionRequestedAt && !response.reSessionResolvedAt,
  ).length;

  return (
    <div className={styles.userGroup}>
      <div className={styles.groupHeader}>
        <div className={styles.avatar}>{userName.charAt(0).toUpperCase()}</div>
        <div className={styles.groupInfo}>
          <h3 className={styles.groupUserName}>{userName}</h3>
          <div className={styles.groupMeta}>
            {userEmail && <span className={styles.groupEmail}>{userEmail}</span>}
            <span className={styles.sessionCount}>
              {totalSessions} {totalSessions === 1 ? 'Session' : 'Sessions'}
            </span>
            {pendingReSessionCount > 0 && (
              <span className={styles.requestCountBadge}>
                {pendingReSessionCount} Re-Session {pendingReSessionCount === 1 ? 'Request' : 'Requests'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.sliderContainer}>
        <button
          type="button"
          className={`${styles.sideArrow} ${styles.prevArrow}`}
          onClick={prevPage}
          disabled={currentPage === 1}
          aria-label="Previous sessions"
        >
          ←
        </button>

        <div className={styles.sessionCards}>
          {currentSessions.map((response, idx) => {
            const chronologicalIndex = chronologicalSessions.findIndex((item) => item._id === response._id);
            const overallIdx =
              chronologicalIndex >= 0 ? totalSessions - chronologicalIndex : totalSessions - (startIndex + idx);
            const hasPendingReSessionRequest = Boolean(response.reSessionRequestedAt && !response.reSessionResolvedAt);
            const hasResolvedReSessionRequest = Boolean(response.reSessionRequestedAt && response.reSessionResolvedAt);
            const canAssignSession =
              !!response.completedAt && (!response.assignedVideoUrl || hasPendingReSessionRequest);

            return (
              <div key={response._id} className={styles.sessionCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.sessionIdentity}>
                    <span className={styles.sessionLabel}>Session #{overallIdx}</span>
                    <span className={styles.sessionDate}>
                      {new Date(response.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className={styles.badgeRow}>
                    <Badge variant={response.completedAt ? 'success' : 'warning'}>
                      {response.completedAt ? 'Completed' : 'In Progress'}
                    </Badge>
                    {response.assignedVideoUrl && <Badge variant="info">Video Assigned</Badge>}
                    {hasPendingReSessionRequest && <Badge variant="purple">Re-Session Requested</Badge>}
                    {hasResolvedReSessionRequest && <Badge variant="neutral">Replacement Assigned</Badge>}
                  </div>
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.stats}>
                    <div className={styles.statLine}>
                      <span className={styles.statLabel}>Answers:</span>
                      <span className={styles.statValue}>
                        {response.answers.length}/{questions.length}
                      </span>
                    </div>
                    {response.completedAt && (
                      <div className={styles.statLine}>
                        <span className={styles.statLabel}>Submitted:</span>
                        <span className={styles.statValue}>
                          {new Date(response.completedAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                    {hasPendingReSessionRequest && response.reSessionRequestedAt && (
                      <div className={styles.statLine}>
                        <span className={styles.statLabel}>Re-Session Request:</span>
                        <span className={styles.statValue}>
                          {new Date(response.reSessionRequestedAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>

                  {hasPendingReSessionRequest && (
                    <div className={styles.requestAlert}>
                      The user requested a replacement session. Assigning a new video will fulfill this request.
                    </div>
                  )}

                  {hasResolvedReSessionRequest && response.reSessionResolvedAt && (
                    <div className={styles.requestResolvedNote}>
                      Replacement session assigned on{' '}
                      {new Date(response.reSessionResolvedAt).toLocaleDateString('en-IN')}.
                    </div>
                  )}

                  {response.assignedVideoUrl && !hasPendingReSessionRequest && !hasResolvedReSessionRequest && (
                    <div className={styles.requestInfoNote}>
                      Replacement assignment stays disabled until the user requests a re-session.
                    </div>
                  )}

                  {response.assignedVideoUrl && (
                    <div className={styles.videoSection}>
                      <a
                        href={response.assignedVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.videoLink}
                      >
                        <span className={styles.videoIcon}>📹</span> View Assigned Session
                      </a>
                    </div>
                  )}

                  {response.answers.length > 0 && (
                    <div className={styles.answersCollapse}>
                      <button
                        type="button"
                        className={styles.toggleAnswersBtn}
                        onClick={() => toggleExpanded(response._id)}
                      >
                        {expandedResponses.has(response._id) ? '▼' : '▶'} View Details
                      </button>

                      {expandedResponses.has(response._id) && (
                        <div className={styles.answersList}>
                          {response.answers.map((answer, index) => (
                            <div key={answer.questionId} className={styles.answerItem}>
                              <div className={styles.questionNumber}>{index + 1}</div>
                              <div className={styles.answerContent}>
                                <div className={styles.questionText}>{getQuestionText(answer.questionId)}</div>
                                <div className={styles.answerText}>{formatAnswer(answer.answer)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.assignBtn}
                    onClick={() => onAssignToResponse(response._id)}
                    disabled={!canAssignSession}
                  >
                    {hasPendingReSessionRequest
                      ? 'Assign Replacement Session'
                      : hasResolvedReSessionRequest
                        ? 'Re-Session Already Used'
                        : response.assignedVideoUrl
                          ? 'Waiting for Re-Session Request'
                          : 'Assign Session'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className={`${styles.sideArrow} ${styles.nextArrow}`}
          onClick={nextPage}
          disabled={currentPage === totalPages}
          aria-label="Next sessions"
        >
          →
        </button>
      </div>

      <div className={styles.sliderInfo}>
        {startIndex + 1}-{Math.min(startIndex + SESSIONS_PER_PAGE, totalSessions)} of {totalSessions}
      </div>
    </div>
  );
};

export default UserSessionGroup;
