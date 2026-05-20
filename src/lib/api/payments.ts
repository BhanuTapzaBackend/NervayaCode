import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';

export interface VerifyPaymentBody {
  orderId: string;
  paymentId: string;
  razorpaySignature: string;
}

export const paymentsApi = {
  verify: (body: VerifyPaymentBody): Promise<ApiResponse<unknown>> => {
    return api.post('/payments/verify', body) as Promise<ApiResponse<unknown>>;
  },
};
