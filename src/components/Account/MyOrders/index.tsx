'use client';

import { useState, useEffect, useMemo } from 'react';
import { Order } from '@/types/supplement.types';
import api from '@/lib/axios';
import { Pagination, GlobalLoader } from '@/components/common';
import { PAGE_SIZE_5 } from '@/lib/constants/pagination.constants';
import styles from './styles.module.css';
import { EmptyOrders } from './EmptyOrders';
import { OrderCard } from './OrderCard';
import { OrderDetailsModal } from './OrderDetailsModal';

export function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [mounted, setMounted] = useState(false);

  const limit = PAGE_SIZE_5;
  const total = orders.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedOrders = useMemo(() => orders.slice((page - 1) * limit, page * limit), [orders, page, limit]);

  useEffect(() => {
    setMounted(true);
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = (await api.get('/orders')) as {
          success: boolean;
          data: Order[];
        };
        if (response.success && response.data) {
          setOrders(response.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <GlobalLoader label="Loading your orders..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>My Orders</h2>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>My Orders</h2>
        <EmptyOrders />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>My Orders</h2>
      <p className={styles.subheading}>Track and manage your recent orders</p>

      <ul className={styles.ordersList} aria-label="Order history">
        {paginatedOrders.map((order) => (
          <OrderCard key={order._id} order={order} onViewDetails={setSelectedOrder} />
        ))}
      </ul>

      {total > 0 && (
        <div className={styles.paginationWrap}>
          <Pagination
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel="My orders pagination"
          />
        </div>
      )}

      {mounted && selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
