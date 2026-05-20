import api from '@/lib/axios';

interface FeedbackPayload {
  score: number;
  comment?: string;
  pageUrl?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const feedbackApi = {
  submit: (payload: FeedbackPayload): Promise<ApiResponse<unknown>> => {
    return api.post('/feedback', payload) as Promise<ApiResponse<unknown>>;
  },
};
