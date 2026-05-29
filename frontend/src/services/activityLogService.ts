import { fetchHelper } from '@/lib/api';
import { IAPIResponse, IPaginatedResponse } from '@/types/api';;;
import { IActivityLogConfig, IActivityLogRes } from '@/types/activity-log';

export const activityLogService = {
  getTables: async (): Promise<IAPIResponse<string[]>> => {
    try {
      return await fetchHelper<IAPIResponse<string[]>>('/admin/database/tables/index');
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  getTableColumns: async (tableName: string): Promise<IAPIResponse<string[]>> => {
    try {
      return await fetchHelper<IAPIResponse<string[]>>(`/admin/database/tables/columns?tableName=${tableName}`);
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  getConfigByTableName: async (tableName: string): Promise<IAPIResponse<IActivityLogConfig>> => {
    try {
      return await fetchHelper<IAPIResponse<IActivityLogConfig>>(`/admin/activity-logs/configs/detail?tableName=${tableName}`);
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  saveConfig: async (config: IActivityLogConfig): Promise<IAPIResponse> => {
    try {
      return await fetchHelper<IAPIResponse>('/admin/activity-logs/configs/index', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  getActivityLogs: async (page: number, limit: number): Promise<IPaginatedResponse<IActivityLogRes>> => {
    try {
      return await fetchHelper<IPaginatedResponse<IActivityLogRes>>(`/admin/activity-logs/index?page=${page}&limit=${limit}`);
    } catch (error: any) {
      return { success: false, message: error.message, data: [], meta: { page, limit, total: 0 } };
    }
  },
};
