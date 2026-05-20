import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';
import type { Order } from '@/types/supplement.types';
import type { PaginationMeta } from '@/types/pagination.types';

export type { PaginationMeta };

export interface AdminOrdersResponse {
  data: Order[];
  meta: PaginationMeta;
}

export interface OrderFiltersParams {
  orderStatus?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  userId?: string;
}

export const ordersApi = {
  getForUser: (): Promise<ApiResponse<Order[]>> => {
    return api.get('/orders') as Promise<ApiResponse<Order[]>>;
  },

  getAllForAdmin: (
    page: number = 1,
    limit: number = 10,
    filters?: OrderFiltersParams,
  ): Promise<ApiResponse<AdminOrdersResponse>> => {
    const params = new URLSearchParams({ admin: 'true', page: String(page), limit: String(limit) });
    if (filters?.orderStatus) params.set('orderStatus', filters.orderStatus);
    if (filters?.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.minAmount != null) params.set('minAmount', String(filters.minAmount));
    if (filters?.maxAmount != null) params.set('maxAmount', String(filters.maxAmount));
    if (filters?.userId) params.set('userId', filters.userId);
    return api.get(`/orders?${params.toString()}`) as Promise<ApiResponse<AdminOrdersResponse>>;
  },
};
