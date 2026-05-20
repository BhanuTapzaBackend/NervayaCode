import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';

export interface DeepRestQuestion {
  _id: string;
  questionId: string;
  questionText: string;
  questionType: string;
  options?: Array<{ id: string; value: string; label: string }>;
  order: number;
  isRequired?: boolean;
  isActive?: boolean;
}

export interface CreateDeepRestQuestionData {
  questionText: string;
  questionType: string;
  options: Array<{ id?: string; value: string; label: string }>;
  order: number;
  isRequired?: boolean;
  isActive?: boolean;
}

export const deepRestQuestionsApi = {
  getQuestions: (includeInactive = false): Promise<ApiResponse<DeepRestQuestion[]>> => {
    const params = includeInactive ? '?includeInactive=true' : '';
    return api.get(`/deep-rest/questions${params}`) as Promise<ApiResponse<DeepRestQuestion[]>>;
  },

  getQuestionById: (id: string): Promise<ApiResponse<DeepRestQuestion>> => {
    return api.get(`/deep-rest/questions/${id}`) as Promise<ApiResponse<DeepRestQuestion>>;
  },

  createQuestion: (data: CreateDeepRestQuestionData): Promise<ApiResponse<DeepRestQuestion>> => {
    return api.post('/deep-rest/questions', data) as Promise<ApiResponse<DeepRestQuestion>>;
  },

  updateQuestion: (id: string, data: Partial<CreateDeepRestQuestionData>): Promise<ApiResponse<DeepRestQuestion>> => {
    return api.put(`/deep-rest/questions/${id}`, data) as Promise<ApiResponse<DeepRestQuestion>>;
  },

  deleteQuestion: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/deep-rest/questions/${id}`) as Promise<ApiResponse<null>>;
  },
};
