import api from '@/lib/axios';
import type { Supplement } from '@/types/supplement.types';
import type { PaginationMeta } from '@/types/pagination.types';

export type { PaginationMeta };

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface SupplementFiltersParams {
  isActive?: boolean;
  search?: string;
  minStock?: number;
  maxStock?: number;
}

export interface AdminSupplementsResponse {
  data: Supplement[];
  meta: PaginationMeta;
}

export const supplementsApi = {
  getAll: (): Promise<ApiResponse<Supplement[]>> => {
    return api.get('/supplements') as Promise<ApiResponse<Supplement[]>>;
  },

  getById: (id: string): Promise<ApiResponse<Supplement>> => {
    return api.get(`/supplements/${id}`) as Promise<ApiResponse<Supplement>>;
  },

  getAllPaginated: (
    page: number = 1,
    limit: number = 10,
    filters?: SupplementFiltersParams,
  ): Promise<ApiResponse<AdminSupplementsResponse>> => {
    const params = new URLSearchParams({
      admin: 'true',
      page: String(page),
      limit: String(limit),
    });
    if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
    if (filters?.search) params.set('search', filters.search);
    if (filters?.minStock != null) params.set('minStock', String(filters.minStock));
    if (filters?.maxStock != null) params.set('maxStock', String(filters.maxStock));
    return api.get(`/supplements?${params.toString()}`) as Promise<ApiResponse<AdminSupplementsResponse>>;
  },
};
