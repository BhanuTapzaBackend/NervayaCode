import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isCustomized?: boolean;
  sessionId?: string;
  sessionStatus?: 'pending' | 'confirmed' | 'completed' | null;
  meetLink?: string;
}

export interface ScheduleByDate {
  date: string;
  slots: TimeSlot[];
}

export interface ScheduleByDateRangeItem {
  date: string;
  slots: TimeSlot[];
}

export const scheduleApi = {
  getByDate: (therapistId: string, date: string, includeBooked = true): Promise<ApiResponse<ScheduleByDate>> => {
    const params = new URLSearchParams({ date, includeBooked: String(includeBooked) });
    return api.get(`/therapists/${therapistId}/schedule?${params.toString()}`) as Promise<ApiResponse<ScheduleByDate>>;
  },

  getByDateRange: (
    therapistId: string,
    startDate: string,
    endDate: string,
    includeBooked = true,
  ): Promise<ApiResponse<ScheduleByDateRangeItem[]>> => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      includeBooked: String(includeBooked),
    });
    return api.get(`/therapists/${therapistId}/schedule?${params.toString()}`) as Promise<
      ApiResponse<ScheduleByDateRangeItem[]>
    >;
  },

  createSlot: (
    therapistId: string,
    body: { date: string; startTime: string; endTime: string; isAvailable?: boolean },
  ): Promise<ApiResponse<unknown>> => {
    return api.post(`/therapists/${therapistId}/schedule`, body) as Promise<ApiResponse<unknown>>;
  },

  updateSlot: (
    therapistId: string,
    body: { date: string; startTime: string; updates: Record<string, unknown> },
  ): Promise<ApiResponse<unknown>> => {
    return api.put(`/therapists/${therapistId}/schedule`, body) as Promise<ApiResponse<unknown>>;
  },

  deleteSlot: (therapistId: string, date: string, startTime: string): Promise<ApiResponse<null>> => {
    const params = new URLSearchParams({ date, startTime });
    return api.delete(`/therapists/${therapistId}/schedule?${params.toString()}`) as Promise<ApiResponse<null>>;
  },
};
