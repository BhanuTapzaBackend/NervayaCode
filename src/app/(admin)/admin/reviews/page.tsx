'use client';

import { useState, useCallback } from 'react';
import PageHeader from '@/components/PageHeader/PageHeader';
import { Pagination, StatusState } from '@/components/common';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import ReviewFilters from '@/components/Admin/ReviewFilters';
import ReviewCard from '@/components/Admin/ReviewCard';
import { useAdminReviews } from '@/queries/reviews/useAdminReviews';
import type { AdminReviewFiltersParams } from '@/lib/api/adminReviews';
import { PAGE_SIZE_10 } from '@/lib/constants/pagination.constants';
import styles from './styles.module.css';

function countActiveFilters(f: AdminReviewFiltersParams): number {
  let n = 0;
  if (f.search) n++;
  if (f.itemType) n++;
  if (f.rating) n++;
  if (f.isVisible !== undefined) n++;
  if (f.dateFrom) n++;
  if (f.dateTo) n++;
  return n;
}

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AdminReviewFiltersParams>({});
  const limit = PAGE_SIZE_10;
  const { data: reviews, meta, isLoading, error, refetch } = useAdminReviews(page, limit, filters);
  const paginationMeta = meta ?? { page: 1, limit, total: 0, totalPages: 1 };
  const handleFiltersApply = useCallback((newFilters: AdminReviewFiltersParams) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleFiltersReset = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Reviews" subtitle="Manage review visibility." />
        <GlobalLoader label="Loading reviews..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Reviews" subtitle="Manage review visibility." />
        <ReviewFilters
          initialFilters={filters}
          onApply={handleFiltersApply}
          onReset={handleFiltersReset}
          activeCount={countActiveFilters(filters)}
        />
        <StatusState
          type="error"
          message={error}
          action={
            <button type="button" onClick={() => refetch()} className={styles.retryButton}>
              Retry
            </button>
          }
        />
      </div>
    );
  }

  if (!reviews?.length) {
    return (
      <div>
        <PageHeader title="Reviews" subtitle="Manage review visibility." />
        <ReviewFilters
          initialFilters={filters}
          onApply={handleFiltersApply}
          onReset={handleFiltersReset}
          activeCount={countActiveFilters(filters)}
        />
        <StatusState type="empty" message="No reviews found." />
        <div className={styles.paginationWrap}>
          <Pagination
            page={paginationMeta.page}
            limit={paginationMeta.limit}
            total={paginationMeta.total}
            totalPages={paginationMeta.totalPages}
            onPageChange={setPage}
            ariaLabel="Reviews pagination"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Manage review visibility." />
      <ReviewFilters
        initialFilters={filters}
        onApply={handleFiltersApply}
        onReset={handleFiltersReset}
        activeCount={countActiveFilters(filters)}
      />
      <ul className={styles.list} aria-label="All reviews">
        {reviews.map((review) => (
          <ReviewCard key={review._id} review={review} onVisibilityToggled={() => refetch()} />
        ))}
      </ul>
      {meta && (
        <div className={styles.paginationWrap}>
          <Pagination
            page={meta.page}
            limit={meta.limit}
            total={meta.total}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            ariaLabel="Reviews pagination"
          />
        </div>
      )}
    </div>
  );
}
