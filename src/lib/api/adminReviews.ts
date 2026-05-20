import api from '@/lib/axios';
import type { PaginationMeta } from '@/types/pagination.types';

export type { PaginationMeta };

export interface AdminReviewFiltersParams {
  rating?: number;
  isVisible?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  itemType?: string;
}

export interface AdminReview {
  _id: string;
  productId: { _id: string; name: string; image: string } | string;
  userId: string;
  userDisplayName?: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  itemType: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewsResponse {
  data: AdminReview[];
  meta: PaginationMeta;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const adminReviewsApi = {
  getAll: (
    page: number,
    limit: number,
    filters?: AdminReviewFiltersParams,
  ): Promise<ApiResponse<AdminReviewsResponse>> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (filters?.rating) params.set('rating', String(filters.rating));
    if (filters?.isVisible !== undefined) params.set('isVisible', String(filters.isVisible));
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.itemType) params.set('itemType', filters.itemType);
    return api.get(`/admin/reviews?${params.toString()}`) as Promise<ApiResponse<AdminReviewsResponse>>;
  },

  toggleVisibility: (reviewId: string): Promise<ApiResponse<AdminReview>> => {
    return api.patch(`/admin/reviews/${reviewId}/visibility`) as Promise<ApiResponse<AdminReview>>;
  },
};
