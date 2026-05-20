'use client';

import { useState, useCallback, useEffect, Fragment } from 'react';
import PageHeader from '@/components/PageHeader/PageHeader';
import { Pagination, StatusState } from '@/components/common';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import FeedbackFilters from '@/components/Admin/FeedbackFilters';
import { useAdminFeedbackGrouped } from '@/queries/feedback/useAdminFeedbackGrouped';
import { useUserFeedbackHistory } from '@/queries/feedback/useUserFeedbackHistory';
import { adminFeedbackApi, type AdminFeedbackFiltersParams, type FeedbackStats } from '@/lib/api/adminFeedback';
import { PAGE_SIZE_10 } from '@/lib/constants/pagination.constants';
import { Icon } from '@iconify/react';
import { getInitials } from '@/utils/string.util';
import { formatReviewDate } from '@/utils/date.util';
import styles from './styles.module.css';
function countActiveFilters(f: AdminFeedbackFiltersParams): number {
  let n = 0;
  if (f.minScore != null && !Number.isNaN(f.minScore)) n++;
  if (f.maxScore != null && !Number.isNaN(f.maxScore)) n++;
  if (f.dateFrom) n++;
  if (f.dateTo) n++;
  return n;
}

function getScoreClass(score: number): string {
  if (score <= 6) return styles.detractor;
  if (score <= 8) return styles.passive;
  return styles.promoter;
}

const formatDate = (dateStr: string): string => formatReviewDate(dateStr, 'en-IN');

export default function AdminFeedbackPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AdminFeedbackFiltersParams>({});
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const limit = PAGE_SIZE_10;

  const { data: users, meta, isLoading, error, refetch } = useAdminFeedbackGrouped(page, limit, filters);
  const { cache: historyCache, loadingUserId, fetchForUser } = useUserFeedbackHistory();
  const paginationMeta = meta ?? { page: 1, limit, total: 0, totalPages: 1 };

  useEffect(() => {
    adminFeedbackApi
      .getStats()
      .then((res) => {
        if (res.success && res.data) setStats(res.data);
      })
      .catch(() => undefined);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setExpandedUsers(new Set());
  }, []);

  const handleFiltersApply = useCallback((newFilters: AdminFeedbackFiltersParams) => {
    setFilters(newFilters);
    setPage(1);
    setExpandedUsers(new Set());
  }, []);

  const handleFiltersReset = useCallback(() => {
    setFilters({});
    setPage(1);
    setExpandedUsers(new Set());
  }, []);

  const toggleUser = useCallback(
    (userId: string) => {
      setExpandedUsers((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) {
          next.delete(userId);
        } else {
          next.add(userId);
          fetchForUser(userId);
        }
        return next;
      });
    },
    [fetchForUser],
  );

  return (
    <div>
      <PageHeader title="Feedback" subtitle="View all user feedback grouped by user." />

      {/* ── NPS Stats Bar ── */}
      {stats && (
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total Responses</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.statAvg}`}>
              {stats.avgScore.toFixed(1)}
              <span className={styles.statMax}>/10</span>
            </span>
            <span className={styles.statLabel}>Avg Score</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.promoterColor}`}>{stats.promoters}</span>
            <span className={styles.statLabel}>
              Promoters
              {stats.total > 0 && (
                <span className={styles.statPct}> ({Math.round((stats.promoters / stats.total) * 100)}%)</span>
              )}
            </span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.passiveColor}`}>{stats.passives}</span>
            <span className={styles.statLabel}>
              Passives
              {stats.total > 0 && (
                <span className={styles.statPct}> ({Math.round((stats.passives / stats.total) * 100)}%)</span>
              )}
            </span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.detractorColor}`}>{stats.detractors}</span>
            <span className={styles.statLabel}>
              Detractors
              {stats.total > 0 && (
                <span className={styles.statPct}> ({Math.round((stats.detractors / stats.total) * 100)}%)</span>
              )}
            </span>
          </div>
        </div>
      )}

      <FeedbackFilters
        initialFilters={filters}
        onApply={handleFiltersApply}
        onReset={handleFiltersReset}
        activeCount={countActiveFilters(filters)}
      />

      {isLoading && <GlobalLoader label="Loading feedback..." />}

      {!isLoading && error && (
        <StatusState
          type="error"
          message={error}
          action={
            <button type="button" onClick={() => refetch()} className={styles.retryButton}>
              Retry
            </button>
          }
        />
      )}

      {!isLoading && !error && !users?.length && <StatusState type="empty" message="No feedback found." />}

      {!isLoading && !error && users && users.length > 0 && (
        <>
          {/* ── Grouped Table ── */}
          <div className={styles.tableWrap}>
            <table className={styles.table} aria-label="Feedback grouped by user">
              <thead>
                <tr>
                  <th className={styles.thUser}>User</th>
                  <th className={styles.thCenter}>Feedbacks</th>
                  <th className={styles.thCenter}>Avg Score</th>
                  <th className={styles.thComment}>Latest Comment</th>
                  <th className={styles.thDate}>Last Submitted</th>
                  <th className={styles.thAction} />
                </tr>
              </thead>
              <tbody>
                {users.map((row) => {
                  const uid = row.userId._id;
                  const isExpanded = expandedUsers.has(uid);
                  const isLoadingHistory = loadingUserId === uid;
                  const history = historyCache[uid];

                  return (
                    <Fragment key={uid}>
                      {/* ── User Row ── */}
                      <tr
                        className={`${styles.userRow} ${isExpanded ? styles.userRowExpanded : ''}`}
                        onClick={() => toggleUser(uid)}
                        aria-expanded={isExpanded}
                      >
                        <td className={styles.tdUser}>
                          <div className={styles.userCell}>
                            <div className={styles.avatar}>{getInitials(row.userId.name)}</div>
                            <div>
                              <p className={styles.userName}>{row.userId.name}</p>
                              {row.userId.email && <p className={styles.userEmail}>{row.userId.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className={styles.tdCenter}>
                          <span className={styles.countBadge}>{row.totalFeedbacks}</span>
                        </td>
                        <td className={styles.tdCenter}>
                          <span className={`${styles.scoreBadge} ${getScoreClass(row.avgScore)}`}>
                            {row.avgScore.toFixed(1)}
                          </span>
                        </td>
                        <td className={styles.tdComment}>
                          <p className={styles.commentPreview}>
                            {row.latestComment || <span className={styles.noComment}>No comment</span>}
                          </p>
                        </td>
                        <td className={styles.tdDate}>{formatDate(row.latestDate)}</td>
                        <td className={styles.tdAction}>
                          <button
                            type="button"
                            className={styles.expandBtn}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUser(uid);
                            }}
                          >
                            <Icon
                              icon={isExpanded ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
                              width={18}
                              height={18}
                            />
                          </button>
                        </td>
                      </tr>

                      {/* ── Accordion Row ── */}
                      {isExpanded && (
                        <tr className={styles.accordionRow}>
                          <td colSpan={6} className={styles.accordionCell}>
                            {isLoadingHistory && <p className={styles.accordionLoading}>Loading history…</p>}
                            {!isLoadingHistory && history && history.length === 0 && (
                              <p className={styles.accordionEmpty}>No entries found.</p>
                            )}
                            {!isLoadingHistory && history && history.length > 0 && (
                              <ul className={styles.historyList}>
                                {history.map((entry) => (
                                  <li key={entry._id} className={styles.historyEntry}>
                                    <div className={styles.historyLeft}>
                                      <span className={`${styles.historyScore} ${getScoreClass(entry.score)}`}>
                                        {entry.score}
                                      </span>
                                      <span className={styles.historyDate}>{formatDate(entry.createdAt)}</span>
                                      {entry.pageUrl && <span className={styles.pageChip}>{entry.pageUrl}</span>}
                                    </div>
                                    <p className={styles.historyComment}>
                                      {entry.comment || <span className={styles.noComment}>No comment</span>}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.paginationWrap}>
            <Pagination
              page={paginationMeta.page}
              limit={paginationMeta.limit}
              total={paginationMeta.total}
              totalPages={paginationMeta.totalPages}
              onPageChange={handlePageChange}
              ariaLabel="Feedback pagination"
            />
          </div>
        </>
      )}
    </div>
  );
}
