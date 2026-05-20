import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';
import type { Session } from '@/types/session.types';
import type { PaginationMeta } from '@/types/pagination.types';

export type { PaginationMeta };

export interface AdminSessionsResponse {
  data: Session[];
  meta: PaginationMeta;
}

export interface SessionFiltersParams {
  status?: string;
  therapistId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const sessionsApi = {
  getForUser: (statusFilter?: string): Promise<ApiResponse<Session[]>> => {
    const params = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    return api.get(`/sessions${params}`) as Promise<ApiResponse<Session[]>>;
  },

  create: (therapistId: string, date: string, startTime: string): Promise<ApiResponse<Session>> => {
    return api.post('/sessions', { therapistId, date, startTime }) as Promise<ApiResponse<Session>>;
  },

  cancel: (sessionId: string): Promise<ApiResponse<Session>> => {
    return api.delete(`/sessions/${sessionId}`) as Promise<ApiResponse<Session>>;
  },

  getAllForAdmin: (
    page: number = 1,
    limit: number = 10,
    filters?: SessionFiltersParams,
  ): Promise<ApiResponse<AdminSessionsResponse>> => {
    const params = new URLSearchParams({ admin: 'true', page: String(page), limit: String(limit) });
    if (filters?.status) params.set('status', filters.status);
    if (filters?.therapistId) params.set('therapistId', filters.therapistId);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.search) params.set('search', filters.search);
    return api.get(`/sessions?${params.toString()}`) as Promise<ApiResponse<AdminSessionsResponse>>;
  },
};
