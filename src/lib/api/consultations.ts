import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';
import type { JitsiTokenResponse } from '@/lib/api/sessions';
import type { PaginationMeta } from '@/types/pagination.types';
import type {
  ConsultationFiltersParams,
  ConsultationLead,
  ConsultationScheduleDay,
  GenerateRangeParams,
  GenerateRangeResult,
  SlotTime,
} from '@/types/consultation.types';

export interface AdminConsultationsResponse {
  data: ConsultationLead[];
  meta: PaginationMeta;
}

export interface ScheduleResponse {
  schedules: ConsultationScheduleDay[];
  /** Latest date holding any slots — drives the runway banner. */
  generatedThrough: string | null;
}

export const consultationsApi = {
  // Public — no auth required; the unguessable lead id acts as the access capability.
  getJitsiToken: (leadId: string): Promise<ApiResponse<JitsiTokenResponse>> => {
    return api.get(`/consultations/${leadId}/jitsi-token`) as Promise<ApiResponse<JitsiTokenResponse>>;
  },

  getAllForAdmin: (
    page: number = 1,
    limit: number = 10,
    filters?: ConsultationFiltersParams,
  ): Promise<ApiResponse<AdminConsultationsResponse>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status) params.set('status', filters.status);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    return api.get(`/admin/consultations?${params.toString()}`) as Promise<ApiResponse<AdminConsultationsResponse>>;
  },

  updateStatus: (id: string, status: 'confirmed' | 'cancelled'): Promise<ApiResponse<ConsultationLead>> => {
    return api.patch(`/admin/consultations/${id}/status`, { status }) as Promise<ApiResponse<ConsultationLead>>;
  },

  getSchedule: (from: string, to: string): Promise<ApiResponse<ScheduleResponse>> => {
    return api.get(`/admin/consultations/schedule?from=${from}&to=${to}`) as Promise<ApiResponse<ScheduleResponse>>;
  },

  generate: (params: GenerateRangeParams): Promise<ApiResponse<GenerateRangeResult>> => {
    return api.post('/admin/consultations/schedule/generate', params) as Promise<ApiResponse<GenerateRangeResult>>;
  },

  replaceDay: (date: string, slots: SlotTime[]): Promise<ApiResponse<ConsultationScheduleDay>> => {
    return api.put(`/admin/consultations/schedule/${date}`, { slots }) as Promise<ApiResponse<ConsultationScheduleDay>>;
  },
};
