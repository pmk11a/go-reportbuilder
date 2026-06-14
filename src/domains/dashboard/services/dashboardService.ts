import { getDashboardStatsFn, getPensiunanWithoutFilesFn } from '@/server/functions/dashboard'
import type { IAPIResponse } from '@/shared/types/api'
import type { IDashboardStats } from '@/domains/dashboard/dashboard'
import type { IPensiunanWithoutFiles } from '@/domains/users/pensiunan'

export const dashboardService = {
  async getStats(): Promise<IAPIResponse<IDashboardStats>> {
    const result = await getDashboardStatsFn()
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async getPensiunanWithoutFiles(page = 1, limit = 10): Promise<IAPIResponse<{ total: number; data: IPensiunanWithoutFiles[]; pagination: any }>> {
    const result = await getPensiunanWithoutFilesFn({ data: { query: `?page=${page}&limit=${limit}` } })
    return { success: true, status: 200, message: 'Success', data: result.data, meta: result.meta } as any
  },
}
