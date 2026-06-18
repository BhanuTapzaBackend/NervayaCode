import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';
import type { JitsiTokenResponse } from '@/lib/api/sessions';

export const consultationsApi = {
  // Public — no auth required; the unguessable lead id acts as the access capability.
  getJitsiToken: (leadId: string): Promise<ApiResponse<JitsiTokenResponse>> => {
    return api.get(`/consultations/${leadId}/jitsi-token`) as Promise<ApiResponse<JitsiTokenResponse>>;
  },
};
