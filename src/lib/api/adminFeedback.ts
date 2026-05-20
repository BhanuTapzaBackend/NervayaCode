import api from '@/lib/axios';
import type { PaginationMeta } from '@/types/pagination.types';

export type { PaginationMeta };

export interface AdminFeedbackFiltersParams {
  minScore?: number;
  maxScore?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AdminFeedback {
  _id: string;
  userId: { _id: string; name: string; email: string } | string;
  score: number;
  comment: string;
  pageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFeedbackSummary {
  userId: { _id: string; name: string; email: string };
  totalFeedbacks: number;
  avgScore: number;
  latestComment: string;
  latestDate: string;
}

export interface FeedbackStats {
  total: number;
  avgScore: number;
  promoters: number;
  passives: number;
  detractors: number;
}

export interface AdminFeedbackResponse {
  data: AdminFeedback[];
  meta: PaginationMeta;
}

export interface GroupedFeedbackResponse {
  data: UserFeedbackSummary[];
  meta: PaginationMeta;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

function buildParams(page: number, limit: number, filters?: AdminFeedbackFiltersParams): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filters?.minScore !== undefined) params.set('minScore', String(filters.minScore));
  if (filters?.maxScore !== undefined) params.set('maxScore', String(filters.maxScore));
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);
  if (filters?.search) params.set('search', filters.search);
  return params.toString();
}

export const adminFeedbackApi = {
  getAll: (
    page: number,
    limit: number,
    filters?: AdminFeedbackFiltersParams,
  ): Promise<ApiResponse<AdminFeedbackResponse>> => {
    return api.get(`/admin/feedback?${buildParams(page, limit, filters)}`) as Promise<
      ApiResponse<AdminFeedbackResponse>
    >;
  },

  getGrouped: (
    page: number,
    limit: number,
    filters?: AdminFeedbackFiltersParams,
  ): Promise<ApiResponse<GroupedFeedbackResponse>> => {
    return api.get(`/admin/feedback?view=grouped&${buildParams(page, limit, filters)}`) as Promise<
      ApiResponse<GroupedFeedbackResponse>
    >;
  },

  getStats: (): Promise<ApiResponse<FeedbackStats>> => {
    return api.get('/admin/feedback?view=stats') as Promise<ApiResponse<FeedbackStats>>;
  },

  getForUser: (userId: string): Promise<ApiResponse<AdminFeedback[]>> => {
    return api.get(`/admin/feedback/user/${userId}`) as Promise<ApiResponse<AdminFeedback[]>>;
  },
};
