import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';
import type { ConsultingHour } from '@/types/therapist.types';

export interface GenerateSlotsResponse {
  insertedCount: number;
  modifiedCount: number;
}

export const consultingHoursApi = {
  get: (therapistId: string): Promise<ApiResponse<ConsultingHour[]>> => {
    return api.get(`/therapists/${therapistId}/consulting-hours`) as Promise<ApiResponse<ConsultingHour[]>>;
  },

  update: (therapistId: string, consultingHours: ConsultingHour[]): Promise<ApiResponse<ConsultingHour[]>> => {
    return api.put(`/therapists/${therapistId}/consulting-hours`, {
      consultingHours,
    }) as Promise<ApiResponse<ConsultingHour[]>>;
  },

  generateSlots: (therapistId: string, days = 30): Promise<ApiResponse<GenerateSlotsResponse>> => {
    return api.post(`/therapists/${therapistId}/schedule/generate?days=${days}`) as Promise<
      ApiResponse<GenerateSlotsResponse>
    >;
  },
};
