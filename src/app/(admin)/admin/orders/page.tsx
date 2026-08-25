'use client';

import React, { useState, useCallback } from 'react';
import PageHeader from '@/components/PageHeader/PageHeader';
import { Badge, Pagination, StatusState } from '@/components/common';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import Button from '@/components/common/Button';
import OrderFilters from '@/components/Admin/OrderFilters';
import OrderDetailModal from '@/components/Admin/OrderDetailModal';
import { useAdminOrders } from '@/queries/orders/useOrders';
import type { OrderFiltersParams } from '@/lib/api/orders';
import type { Order } from '@/types/supplement.types';
import { formatPrice } from '@/utils/cart.util';
import { formatOrderId, orderStatusVariant, paymentStatusVariant } from '@/utils/order-status.util';
import { PAGE_SIZE_10 } from '@/lib/constants/pagination.constants';
import styles from './styles.module.css';

function countActiveFilters(f: OrderFiltersParams): number {
  let n = 0;
  if (f.orderStatus) n++;
  if (f.paymentStatus) n++;
  if (f.dateFrom) n++;
  if (f.dateTo) n++;
  if (f.minAmount != null && !Number.isNaN(f.minAmount)) n++;
  if (f.maxAmount != null && !Number.isNaN(f.maxAmount)) n++;
  if (f.userId?.trim()) n++;
  return n;
}

function formatItems(order: Order): string {
  const count = order.items.length;
  const firstName = order.items[0]?.name ?? 'No items';
  if (count <= 1) return firstName;
  return `${firstName} +${count - 1} more`;
}

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString();
}

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<OrderFiltersParams>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const limit = PAGE_SIZE_10;
  const { data: orders, meta, isLoading, error, refetch } = useAdminOrders(page, limit, filters);
  const paginationMeta = meta ?? { page: 1, limit, total: 0, totalPages: 1 };
  const handleFiltersApply = useCallback((newFilters: OrderFiltersParams) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleFiltersReset = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const handleCardKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>, order: Order) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setSelectedOrder(order);
  }, []);

  const rows = orders ?? [];

  return (
    <div>
      <PageHeader title="Orders" subtitle="View all orders (read-only). Select an order to see its details." />
      <OrderFilters
        initialFilters={filters}
        onApply={handleFiltersApply}
        onReset={handleFiltersReset}
        activeCount={countActiveFilters(filters)}
      />

      {isLoading ? (
        <GlobalLoader label="Loading orders..." />
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
        <StatusState type="empty" message="No orders found." />
      ) : (
        <>
          <section className={styles.list} aria-label="Orders">
            {rows.map((order) => (
              <article
                key={order._id}
                className={styles.card}
                role="button"
                tabIndex={0}
                aria-label={`View details for order ${formatOrderId(String(order._id))}`}
                onClick={() => setSelectedOrder(order)}
                onKeyDown={(event) => handleCardKeyDown(event, order)}
              >
                <header className={styles.cardHeader}>
                  <span className={styles.orderId}>{formatOrderId(String(order._id))}</span>
                  <span className={styles.date}>{formatDate(order.createdAt)}</span>
                </header>

                <div className={styles.cardBody}>
                  <p className={styles.items}>{formatItems(order)}</p>
                  <p className={styles.total}>{formatPrice(order.totalAmount)}</p>
                </div>

                <footer className={styles.cardFooter}>
                  <Badge variant={orderStatusVariant(order.orderStatus)} shape="pill" size="sm">
                    {order.orderStatus}
                  </Badge>
                  <Badge variant={paymentStatusVariant(order.paymentStatus)} shape="pill" size="sm">
                    {order.paymentStatus}
                  </Badge>
                  <span className={styles.viewHint} aria-hidden="true">
                    View details
                  </span>
                </footer>
              </article>
            ))}
          </section>

          <div className={styles.paginationWrap}>
            <Pagination
              page={paginationMeta.page}
              limit={paginationMeta.limit}
              total={paginationMeta.total}
              totalPages={paginationMeta.totalPages}
              onPageChange={setPage}
              ariaLabel="Orders pagination"
            />
          </div>
        </>
      )}

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
