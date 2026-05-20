import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';
import type { Session } from '@/types/session.types';
import type { Order } from '@/types/supplement.types';
import type { ISleepAssessmentResponse } from '@/types/sleepAssessment.types';

export const dashboardApi = {
  getSessions: (): Promise<ApiResponse<Session[]>> => {
    return api.get('/sessions') as Promise<ApiResponse<Session[]>>;
  },

  getOrders: (): Promise<ApiResponse<Order[]>> => {
    return api.get('/orders') as Promise<ApiResponse<Order[]>>;
  },

  getLatestAssessment: (): Promise<ApiResponse<ISleepAssessmentResponse | null>> => {
    return api.get('/sleep-assessment/responses?latest=true') as Promise<ApiResponse<ISleepAssessmentResponse | null>>;
  },

  getInProgressAssessment: (): Promise<ApiResponse<ISleepAssessmentResponse | null>> => {
    return api.get('/sleep-assessment/responses?inProgress=true') as Promise<
      ApiResponse<ISleepAssessmentResponse | null>
    >;
  },
};
