import { getActivityLogsFn, getActivityLogConfigDetailFn, getActivityLogsByUserFn } from '@/server/functions/admin/activity-logs'
import { getDatabaseTablesFn, getDatabaseColumnsFn } from '@/server/functions/admin/database'
import { proxyFn } from '@/server/functions/proxy'
import type { IAPIResponse, IPaginatedResponse } from '@/shared/types/api'
import type { IActivityLogConfig, IActivityLogRes } from '@/domains/activity/types/activity-log'

export const activityLogService = {
  getTables: async (): Promise<IAPIResponse<string[]>> => {
    const result = await getDatabaseTablesFn()
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  getTableColumns: async (tableName: string): Promise<IAPIResponse<string[]>> => {
    const result = await getDatabaseColumnsFn({ data: { table: tableName } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  getConfigByTableName: async (tableName: string): Promise<IAPIResponse<IActivityLogConfig>> => {
    const result = await getActivityLogConfigDetailFn({ data: { id: tableName } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  saveConfig: async (config: IActivityLogConfig): Promise<IAPIResponse> => {
    const result = await proxyFn({
      data: {
        endpoint: '/api/admin/activity-logs/configs',
        method: 'POST',
        body: config,
      },
    })
    return { success: true, status: 200, message: 'Success', data: result.data } as any
  },

  getActivityLogs: async (page: number, limit: number): Promise<IPaginatedResponse<IActivityLogRes>> => {
    const result = await getActivityLogsFn({ data: { query: `?page=${page}&limit=${limit}` } })
    return { success: true, status: 200, message: 'Success', data: result.data, meta: result.meta } as any
  },

  getActivityLogsByUser: async (userId: string, page: number, limit: number, query?: string, startDate?: string, endDate?: string): Promise<IPaginatedResponse<IActivityLogRes>> => {
    const result = await getActivityLogsByUserFn({ data: { userId, page, limit, query, startDate, endDate } })
    return { success: true, status: 200, message: 'Success', data: result.data, meta: result.meta } as any
  },
}
