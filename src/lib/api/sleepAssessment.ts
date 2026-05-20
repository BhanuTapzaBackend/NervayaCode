import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';

export interface SleepAssessmentQuestion {
  _id: string;
  questionText: string;
  questionType: string;
  options?: Array<{ value: string; label?: string }>;
  order: number;
  isRequired?: boolean;
  isActive?: boolean;
}

export interface CreateQuestionData {
  questionText: string;
  questionType: string;
  options: Array<{ value: string; label?: string } | { id: string; value: string; label: string }>;
  order: number;
  isRequired?: boolean;
  isActive?: boolean;
}

export const sleepAssessmentApi = {
  getQuestions: (includeInactive = false): Promise<ApiResponse<SleepAssessmentQuestion[]>> => {
    const params = includeInactive ? '?includeInactive=true' : '';
    return api.get(`/sleep-assessment/questions${params}`) as Promise<ApiResponse<SleepAssessmentQuestion[]>>;
  },

  getQuestionById: (id: string): Promise<ApiResponse<SleepAssessmentQuestion>> => {
    return api.get(`/sleep-assessment/questions/${id}`) as Promise<ApiResponse<SleepAssessmentQuestion>>;
  },

  createQuestion: (data: CreateQuestionData): Promise<ApiResponse<SleepAssessmentQuestion>> => {
    return api.post('/sleep-assessment/questions', data) as Promise<ApiResponse<SleepAssessmentQuestion>>;
  },

  updateQuestion: (id: string, data: Partial<CreateQuestionData>): Promise<ApiResponse<SleepAssessmentQuestion>> => {
    return api.put(`/sleep-assessment/questions/${id}`, data) as Promise<ApiResponse<SleepAssessmentQuestion>>;
  },

  deleteQuestion: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/sleep-assessment/questions/${id}`) as Promise<ApiResponse<null>>;
  },

  getResponses: (params?: { latest?: boolean; inProgress?: boolean }): Promise<ApiResponse<unknown>> => {
    const searchParams = new URLSearchParams();
    if (params?.latest) searchParams.set('latest', 'true');
    if (params?.inProgress) searchParams.set('inProgress', 'true');
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return api.get(`/sleep-assessment/responses${query}`) as Promise<ApiResponse<unknown>>;
  },
};
