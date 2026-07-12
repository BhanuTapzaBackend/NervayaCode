'use client';

import { useState, useCallback } from 'react';
import PageHeader from '@/components/PageHeader/PageHeader';
import { Badge, Button, Pagination, StatusState, GlobalLoader } from '@/components/common';
import ConsultationFilters from '@/components/Admin/ConsultationFilters';
import { useAdminConsultations } from '@/queries/consultations/useAdminConsultations';
import { consultationsApi } from '@/lib/api/consultations';
import { PAGE_SIZE_10 } from '@/lib/constants/pagination.constants';
import type { ConsultationFiltersParams, ConsultationLead } from '@/types/consultation.types';
import styles from './styles.module.css';

type StatusVariant = 'success' | 'warning' | 'error' | 'neutral';

function statusVariant(status: string): StatusVariant {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'error';
    default:
      return 'neutral';
  }
}

function countActiveFilters(f: ConsultationFiltersParams): number {
  return [f.status, f.dateFrom, f.dateTo].filter(Boolean).length;
}

export default function AdminConsultationsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ConsultationFiltersParams>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, meta, isLoading, error, refetch } = useAdminConsultations(page, PAGE_SIZE_10, filters);
  const paginationMeta = meta ?? { page: 1, limit: PAGE_SIZE_10, total: 0, totalPages: 1 };

  const handleApply = useCallback((next: ConsultationFiltersParams) => {
    setFilters(next);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const handleStatusChange = useCallback(
    async (id: string, status: 'confirmed' | 'cancelled') => {
      setPendingId(id);
      setActionError(null);
      try {
        const response = await consultationsApi.updateStatus(id, status);
        if (response.success) {
          refetch();
        } else {
          setActionError(response.message ?? 'Could not update the booking.');
        }
      } catch {
        setActionError('Could not update the booking. Please try again.');
      } finally {
        setPendingId(null);
      }
    },
    [refetch],
  );

  return (
    <div>
      <PageHeader
        title="Consultations"
        subtitle="Free 1-on-1 bookings. Cancelling a booking frees its slot for someone else."
      />

      <ConsultationFilters
        initialFilters={filters}
        onApply={handleApply}
        onReset={handleReset}
        activeCount={countActiveFilters(filters)}
      />

      {actionError && <StatusState type="error" message={actionError} variant="minimal" />}

      {isLoading ? (
        <GlobalLoader label="Loading consultations..." />
      ) : error ? (
        <StatusState type="error" message={error} />
      ) : data.length === 0 ? (
        <StatusState type="empty" message="No consultations match these filters." />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((lead: ConsultationLead) => (
                  <tr key={lead._id}>
                    <td>{`${lead.firstName} ${lead.lastName}`}</td>
                    <td>{lead.email || lead.mobile || '-'}</td>
                    <td>{lead.date}</td>
                    <td>{lead.time}</td>
                    <td>{lead.connectionType}</td>
                    <td>
                      <Badge variant={statusVariant(lead.status)} size="sm">
                        {lead.status}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {lead.status === 'pending' && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={pendingId === lead._id}
                            onClick={() => handleStatusChange(lead._id, 'confirmed')}
                          >
                            Confirm
                          </Button>
                        )}
                        {lead.status !== 'cancelled' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={pendingId === lead._id}
                            onClick={() => handleStatusChange(lead._id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={paginationMeta.page}
            limit={paginationMeta.limit}
            total={paginationMeta.total}
            totalPages={paginationMeta.totalPages}
            onPageChange={setPage}
            ariaLabel="Consultations pagination"
          />
        </>
      )}
    </div>
  );
}
