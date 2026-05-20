import axiosInstance from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';
import type { ConfigValue, ISystemConfig, ISystemConfigValueMap } from '@/types/systemConfig.types';

export const configApi = {
  getPublic: (): Promise<ApiResponse<ISystemConfigValueMap>> =>
    axiosInstance.get('/config') as Promise<ApiResponse<ISystemConfigValueMap>>,
  getAll: (): Promise<ApiResponse<ISystemConfig[]>> =>
    axiosInstance.get('/admin/config') as Promise<ApiResponse<ISystemConfig[]>>,
  update: (key: string, value: ConfigValue, isPublic = false, description = ''): Promise<ApiResponse<ISystemConfig>> =>
    axiosInstance.post('/admin/config', { key, value, isPublic, description }) as Promise<ApiResponse<ISystemConfig>>,
};
