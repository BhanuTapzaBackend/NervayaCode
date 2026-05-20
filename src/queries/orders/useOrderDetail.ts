'use client';

import { useCallback, useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api/orders';
import type { Order } from '@/types/supplement.types';

interface OrderDetailState {
  order: Order | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrderDetail(orderId: string): OrderDetailState {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(orderId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await ordersApi.getForUser();
      if (response.success && response.data) {
        const found = response.data.find((o) => o._id === orderId) ?? null;
        if (!found) {
          setError('Order not found');
          setOrder(null);
        } else {
          setOrder(found);
        }
      } else {
        setError(response.message ?? 'Failed to load order');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { order, isLoading, error, refetch: load };
}
