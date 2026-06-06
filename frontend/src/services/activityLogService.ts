import { fetchHelper } from '@/lib/api';
import { IAPIResponse, IPaginatedResponse } from '@/types/api';;;
import { IActivityLogConfig, IActivityLogRes } from '@/types/activity-log';

export const activityLogService = {
  getTables: async (): Promise<IAPIResponse<string[]>> => {
    return await fetchHelper<IAPIResponse<string[]>>('/admin/database/tables/index');
  },

  getTableColumns: async (tableName: string): Promise<IAPIResponse<string[]>> => {
    return await fetchHelper<IAPIResponse<string[]>>(`/admin/database/tables/columns?tableName=${tableName}`);
  },

  getConfigByTableName: async (tableName: string): Promise<IAPIResponse<IActivityLogConfig>> => {
    return await fetchHelper<IAPIResponse<IActivityLogConfig>>(`/admin/activity-logs/configs/detail?tableName=${tableName}`);
  },

  saveConfig: async (config: IActivityLogConfig): Promise<IAPIResponse> => {
    return await fetchHelper<IAPIResponse>('/admin/activity-logs/configs', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  getActivityLogs: async (page: number, limit: number): Promise<IPaginatedResponse<IActivityLogRes>> => {
    return await fetchHelper<IPaginatedResponse<IActivityLogRes>>(`/admin/activity-logs/index?page=${page}&limit=${limit}`);
  },
};
