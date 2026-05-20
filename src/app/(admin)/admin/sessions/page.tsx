'use client';

import { useState, useCallback } from 'react';
import PageHeader from '@/components/PageHeader/PageHeader';
import { Badge, Pagination, StatusState } from '@/components/common';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import Button from '@/components/common/Button';
import SessionFilters from '@/components/Admin/SessionFilters';
import { useAdminSessions } from '@/queries/sessions/useSessions';
import type { SessionFiltersParams } from '@/lib/api/sessions';
import { PAGE_SIZE_10 } from '@/lib/constants/pagination.constants';
import type { Therapist } from '@/types/therapist.types';
import type { Session, SessionUserSummary } from '@/types/session.types';
import styles from './styles.module.css';

function countActiveFilters(f: SessionFiltersParams): number {
  let n = 0;
  if (f.status) n++;
  if (f.therapistId) n++;
  if (f.dateFrom) n++;
  if (f.dateTo) n++;
  if (f.search?.trim()) n++;
  return n;
}

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

function statusVariant(status: string): StatusVariant {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'error';
    case 'confirmed':
      return 'info';
    default:
      return 'neutral';
  }
}

function getTherapistName(session: Session): string {
  const therapist = session.therapistId as unknown as Therapist;
  return therapist?.name ?? 'Unknown Therapist';
}

function getUserSummary(session: Session): SessionUserSummary | null {
  const userRef = session.userId;
  return typeof userRef === 'object' && userRef !== null ? (userRef as SessionUserSummary) : null;
}

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString();
}

export default function AdminSessionsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SessionFiltersParams>({});
  const limit = PAGE_SIZE_10;
  const { data: sessions, meta, isLoading, error, refetch } = useAdminSessions(page, limit, filters);
  const paginationMeta = meta ?? { page: 1, limit, total: 0, totalPages: 1 };
  const handleFiltersApply = useCallback((newFilters: SessionFiltersParams) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleFiltersReset = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const rows = sessions ?? [];

  return (
    <div>
      <PageHeader title="Sessions" subtitle="View all sessions (read-only)." />
      <SessionFilters
        initialFilters={filters}
        onApply={handleFiltersApply}
        onReset={handleFiltersReset}
        activeCount={countActiveFilters(filters)}
      />

      {isLoading ? (
        <GlobalLoader label="Loading sessions..." />
      ) : error ? (
        <StatusState
          type="error"
          message={error}
          action={
            <Button type="button" variant="primary" size="md" fullWidth={false} onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <StatusState type="empty" message="No sessions found." />
      ) : (
        <>
          <section className={styles.list} aria-label="Sessions">
            {rows.map((session) => {
              const user = getUserSummary(session);
              return (
                <article key={session._id} className={styles.card}>
                  <header className={styles.cardHeader}>
                    <h3 className={styles.therapistName}>{getTherapistName(session)}</h3>
                    <div className={styles.schedule}>
                      <span className={styles.date}>{formatDate(session.date)}</span>
                      <span className={styles.dot} aria-hidden="true">
                        ·
                      </span>
                      <span className={styles.time}>
                        {session.startTime} – {session.endTime}
                      </span>
                    </div>
                  </header>

                  <div className={styles.cardBody}>
                    <div className={styles.userBlock}>
                      <p className={styles.userName}>{user?.name ?? 'Unknown user'}</p>
                      {user?.email && <p className={styles.userEmail}>{user.email}</p>}
                    </div>
                    <Badge variant={statusVariant(session.status)} shape="pill" size="sm">
                      {session.status}
                    </Badge>
                  </div>
                </article>
              );
            })}
          </section>

          <div className={styles.paginationWrap}>
            <Pagination
              page={paginationMeta.page}
              limit={paginationMeta.limit}
              total={paginationMeta.total}
              totalPages={paginationMeta.totalPages}
              onPageChange={setPage}
              ariaLabel="Sessions pagination"
            />
          </div>
        </>
      )}
    </div>
  );
}
