import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';
import type { IDeepRestOrder, IDeepRestResponse } from '@/types/deepRest.types';

export const deepRestApi = {
  createOrder: (): Promise<ApiResponse<IDeepRestOrder>> =>
    api.post('/deep-rest/orders') as Promise<ApiResponse<IDeepRestOrder>>,

  getOrder: (id: string): Promise<ApiResponse<IDeepRestOrder>> =>
    api.get(`/deep-rest/orders/${id}`) as Promise<ApiResponse<IDeepRestOrder>>,

  getOrders: (
    page = 1,
    limit = 10,
  ): Promise<
    ApiResponse<{ data: IDeepRestOrder[]; meta: { total: number; page: number; limit: number; totalPages: number } }>
  > =>
    api.get(`/deep-rest/orders?page=${page}&limit=${limit}`) as Promise<
      ApiResponse<{
        data: IDeepRestOrder[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>
    >,

  createRazorpayOrder: (
    deepRestOrderId: string,
  ): Promise<ApiResponse<{ id: string; amount: number; currency: string; key_id: string }>> =>
    api.post('/payments/deep-rest/create-order', { driftOffOrderId: deepRestOrderId }) as Promise<
      ApiResponse<{ id: string; amount: number; currency: string; key_id: string }>
    >,

  verifyPayment: (body: {
    deepRestOrderId: string;
    paymentId: string;
    razorpaySignature: string;
  }): Promise<ApiResponse<{ verified: boolean; orderId: string }>> =>
    api.post('/payments/deep-rest/verify', {
      driftOffOrderId: body.deepRestOrderId,
      paymentId: body.paymentId,
      razorpaySignature: body.razorpaySignature,
    }) as Promise<ApiResponse<{ verified: boolean; orderId: string }>>,

  getResponses: (
    page?: number,
    limit?: number,
  ): Promise<
    ApiResponse<{ data: IDeepRestResponse[]; meta: { total: number; page: number; limit: number; totalPages: number } }>
  > => {
    // Cache-bust: responses change after payment/assessment without URL change
    const params = new URLSearchParams({ t: String(Date.now()) });
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    return api.get(`/deep-rest/responses?${params.toString()}`) as Promise<
      ApiResponse<{
        data: IDeepRestResponse[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>
    >;
  },

  saveAnswer: (body: {
    deepRestOrderId: string;
    questionId: string;
    answer: string | string[];
  }): Promise<ApiResponse<IDeepRestResponse>> =>
    api.post('/deep-rest/responses', {
      driftOffOrderId: body.deepRestOrderId,
      questionId: body.questionId,
      answer: body.answer,
    }) as Promise<ApiResponse<IDeepRestResponse>>,

  completeAssessment: (deepRestOrderId: string): Promise<ApiResponse<IDeepRestResponse>> =>
    api.post('/deep-rest/responses/complete', { driftOffOrderId: deepRestOrderId }) as Promise<
      ApiResponse<IDeepRestResponse>
    >,

  getAllResponsesAdmin: (): Promise<ApiResponse<IDeepRestResponse[]>> =>
    api.get('/admin/deep-rest/responses') as Promise<ApiResponse<IDeepRestResponse[]>>,

  assignVideo: (responseId: string, videoUrl: string): Promise<ApiResponse<IDeepRestResponse>> =>
    api.put(`/admin/deep-rest/responses/${responseId}/assign-video`, { videoUrl }) as Promise<
      ApiResponse<IDeepRestResponse>
    >,

  requestReSession: (
    responseId: string,
    answers?: { questionId: string; answer: string | string[] }[],
  ): Promise<ApiResponse<IDeepRestResponse>> =>
    api.post(`/deep-rest/responses/${responseId}/request-re-session`, answers ? { answers } : undefined) as Promise<
      ApiResponse<IDeepRestResponse>
    >,

  submitReview: (responseId: string, body: { rating: number; comment?: string }): Promise<ApiResponse<unknown>> =>
    api.post(`/deep-rest/responses/${responseId}/reviews`, body) as Promise<ApiResponse<unknown>>,

  getApprovedReviews: (
    page = 1,
    limit = 20,
  ): Promise<
    ApiResponse<{
      data: { _id: string; userDisplayName?: string; rating: number; comment: string }[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>
  > =>
    api.get(`/reviews/DriftOff/approved?page=${page}&limit=${limit}`) as Promise<
      ApiResponse<{
        data: { _id: string; userDisplayName?: string; rating: number; comment: string }[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>
    >,
};
