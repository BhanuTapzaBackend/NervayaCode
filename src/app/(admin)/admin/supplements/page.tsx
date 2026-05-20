'use client';

import React, { useState, useCallback } from 'react';
import type { SupplementFiltersParams } from '@/lib/api/supplements';
import SupplementList from '@/components/Admin/SupplementList';
import SupplementFilters from '@/components/Admin/SupplementFilters';
import PageHeader from '@/components/PageHeader/PageHeader';
import { Pagination } from '@/components/common';
import { useAdminSupplements } from '@/queries/supplements/useSupplements';
import api from '@/lib/axios';
import { PAGE_SIZE_10 } from '@/lib/constants/pagination.constants';
import styles from './styles.module.css';
import { toast } from 'sonner';
import Link from 'next/link';

function countActiveFilters(f: SupplementFiltersParams): number {
  let n = 0;
  if (f.isActive !== undefined) n++;
  if (f.search?.trim()) n++;
  if (f.minStock != null && !Number.isNaN(f.minStock)) n++;
  if (f.maxStock != null && !Number.isNaN(f.maxStock)) n++;
  return n;
}

export default function AdminSupplementsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SupplementFiltersParams>({});
  const limit = PAGE_SIZE_10;
  const { data: supplements, meta, isLoading, error: fetchError, refetch } = useAdminSupplements(page, limit, filters);
  const paginationMeta = meta ?? { page: 1, limit, total: 0, totalPages: 1 };

  const handleFiltersApply = useCallback((newFilters: SupplementFiltersParams) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleFiltersReset = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = (await api.delete(`/supplements/${id}`)) as { success: boolean };
      if (response.success) {
        toast.success('Supplement deleted successfully');
        refetch();
      } else {
        toast.error('Failed to delete supplement');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete supplement');
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Supplements"
        subtitle="Manage supplement inventory and details"
        actions={
          <Link href="/admin/supplements/add" className={styles.addButton}>
            Add New Supplement
          </Link>
        }
      />
      {fetchError && (
        <div className={styles.error} role="alert">
          {fetchError}
        </div>
      )}
      <SupplementFilters
        initialFilters={filters}
        onApply={handleFiltersApply}
        onReset={handleFiltersReset}
        activeCount={countActiveFilters(filters)}
      />
      <SupplementList supplements={supplements ?? []} onDelete={handleDelete} loading={isLoading} />
      <div className={styles.paginationWrap}>
        <Pagination
          page={paginationMeta.page}
          limit={paginationMeta.limit}
          total={paginationMeta.total}
          totalPages={paginationMeta.totalPages}
          onPageChange={setPage}
          ariaLabel="Supplements pagination"
        />
      </div>
    </div>
  );
}
