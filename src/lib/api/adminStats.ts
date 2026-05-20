import api from '@/lib/axios';
import type { DashboardStats } from '@/lib/services/adminStats.service';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const adminStatsApi = {
  getDashboardStats: (): Promise<ApiResponse<DashboardStats>> => {
    return api.get('/admin/stats') as Promise<ApiResponse<DashboardStats>>;
  },
};
