import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';
import type { Therapist } from '@/types/therapist.types';

export interface TherapistSession {
  _id: string;
  userId: string;
  therapistId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  meetLink?: string;
  createdAt: string;
  updatedAt: string;
}

export const therapistApi = {
  getMe: (): Promise<ApiResponse<Therapist>> => {
    return api.get('/therapist/me') as Promise<ApiResponse<Therapist>>;
  },

  getSessions: (status?: string): Promise<ApiResponse<TherapistSession[]>> => {
    const url = status ? `/therapist/sessions?status=${encodeURIComponent(status)}` : '/therapist/sessions';
    return api.get(url) as Promise<ApiResponse<TherapistSession[]>>;
  },
};
