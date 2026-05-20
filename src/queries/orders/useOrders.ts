import { useState, useEffect, useCallback } from 'react';
import { ordersApi, type PaginationMeta, type OrderFiltersParams } from '@/lib/api/orders';
import type { Order } from '@/types/supplement.types';

export function useAdminOrders(page: number, limit: number, filters?: OrderFiltersParams) {
  const [data, setData] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const filtersKey = JSON.stringify(filters ?? {});

  useEffect(() => {
    let active = true;

    async function fetchOrders() {
      setIsLoading(true);
      setError(null);
      try {
        const parsed: OrderFiltersParams = JSON.parse(filtersKey);
        const response = await ordersApi.getAllForAdmin(page, limit, parsed);
        if (!active) return;
        if (response.success && response.data) {
          setData(response.data.data);
          setMeta(response.data.meta);
        } else {
          setData([]);
          setMeta(null);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load orders');
        setData([]);
        setMeta(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchOrders();
    return () => {
      active = false;
    };
  }, [page, limit, filtersKey, fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  return { data, meta, isLoading, error, refetch };
}
