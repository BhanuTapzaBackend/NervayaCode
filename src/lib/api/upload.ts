import { apiUpload } from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';

export interface UploadResponse {
  url: string;
}

export const uploadApi = {
  upload: (formData: FormData): Promise<ApiResponse<UploadResponse>> => {
    return apiUpload.post('/upload', formData) as Promise<ApiResponse<UploadResponse>>;
  },
  image: (formData: FormData): Promise<ApiResponse<UploadResponse>> => {
    return apiUpload.post('/upload', formData) as Promise<ApiResponse<UploadResponse>>;
  },
  video: (formData: FormData): Promise<ApiResponse<UploadResponse>> => {
    return apiUpload.post('/upload', formData) as Promise<ApiResponse<UploadResponse>>;
  },
};
