'use client';

import { useState, useEffect, useSyncExternalStore, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ICON_PLUS_CIRCLE } from '@/constants/icons';
import { Pagination, GlobalLoader } from '@/components/common';
import Button from '@/components/common/Button';
import { deepRestApi } from '@/lib/api/deepRest';
import type { IDriftOffResponse } from '@/types/driftOff.types';
import { SessionCard } from './SessionCard';
import { EmptySessions } from './EmptySessions';
import styles from './MySessionsSection.module.css';

const emptySubscribe = () => () => {};
const getClient = () => true;
const getServer = () => false;

const DEFAULT_LIMIT = 5;

interface MySessionsSectionProps {
  className?: string;
}

export default function MySessionsSection({ className = '' }: MySessionsSectionProps) {
  const hasMounted = useSyncExternalStore(emptySubscribe, getClient, getServer);
  const [responses, setResponses] = useState<IDriftOffResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadResponses = useCallback(async (page: number, pageLimit: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await deepRestApi.getResponses(page, pageLimit);
      if (res.success && res.data) {
        const sorted = [...res.data.data].sort((a, b) => {
          // Pending assessment (no completedAt) first
          if (!a.completedAt && b.completedAt) return -1;
          if (a.completedAt && !b.completedAt) return 1;
          // Then by creation date descending
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setResponses(sorted);
        setTotal(res.data.meta.total);
        setTotalPages(res.data.meta.totalPages);
      } else {
        setResponses([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch {
      setError('Failed to load your sessions. Please try again.');
      toast.error('Failed to load your sessions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResponses(currentPage, limit);
  }, [loadResponses, currentPage, limit]);

  useEffect(() => {
    const handleEvents = () => {
      if ((document.visibilityState === 'visible' || window.name === 'focus') && !isLoading) {
        loadResponses(currentPage, limit);
      }
    };

    document.addEventListener('visibilitychange', handleEvents);
    window.addEventListener('focus', handleEvents);

    return () => {
      document.removeEventListener('visibilitychange', handleEvents);
      window.removeEventListener('focus', handleEvents);
    };
  }, [loadResponses, isLoading, currentPage, limit]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <section className={`${styles.section} ${className}`} aria-labelledby="my-sessions-heading">
      <Toaster position="top-center" richColors closeButton />
      <div className={styles.contentWrapper}>
        {isLoading ? (
          <GlobalLoader label="Loading your sessions..." />
        ) : error ? (
          <div className={styles.center}>
            <p className={styles.errorText}>{error}</p>
            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth={false}
              onClick={() => loadResponses(currentPage, limit)}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.sessionsGrid}>
              {responses.length === 0 && total === 0 && <EmptySessions />}
              {responses.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  hasMounted={hasMounted}
                  isRequesting={false}
                  requestError={undefined}
                />
              ))}

              {total > 0 && (
                <Link href="/deep-rest/payment" className={styles.addSessionCard}>
                  <div className={styles.addIcon}>
                    <Icon icon={ICON_PLUS_CIRCLE} width={48} height={48} />
                  </div>
                  <h3 className={styles.addTitle}>Need another session?</h3>
                  <p className={styles.addText}>Every session is uniquely crafted for your current state.</p>
                  <div className={styles.btnRectangle}>Buy New Session</div>
                </Link>
              )}
            </div>

            <div className={styles.paginationWrapper}>
              <Pagination
                page={currentPage}
                limit={limit}
                total={total}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
