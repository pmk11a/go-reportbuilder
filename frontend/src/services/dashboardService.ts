import { fetchHelper } from '@/lib/api'
import type { IAPIResponse } from '@/types/api';;
import type { IDashboardStats } from '@/types/dashboard';
import type { IPensiunanWithoutFiles } from '@/types/pensiunan';

export const dashboardService = {
  /**
   * Fetches dashboard statistics
   */
  async getStats(): Promise<IAPIResponse<IDashboardStats>> {
    try {
      return await fetchHelper<IAPIResponse<IDashboardStats>>( '/dashboard/stats' )
    } catch ( error: any ) {
      return {
        success: false,
        message: error.message || 'Failed to fetch dashboard statistics'
      }
    }
  },

  /**
   * Fetches retired employees without files
   */
  async getPensiunanWithoutFiles(page = 1, limit = 10): Promise<IAPIResponse<{ total: number; data: IPensiunanWithoutFiles[]; pagination: any }>> {
    try {
      return await fetchHelper<IAPIResponse<{ total: number; data: IPensiunanWithoutFiles[]; pagination: any }>>( `/dashboard/pensiunan-without-files?page=${page}&limit=${limit}` )
    } catch ( error: any ) {
      return {
        success: false,
        message: error.message || 'Failed to fetch pensiunan without files'
      }
    }
  }
}
