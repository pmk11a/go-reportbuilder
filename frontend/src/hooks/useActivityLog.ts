import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { activityLogService } from '@/services/activityLogService'
import type { IPaginatedResponse } from '@/types/api'
import type { IActivityLogRes } from '@/types/activity-log'

interface UseActivityLogsByUserOptions {
  page: number
  limit: number
  query?: string
  startDate?: string
  endDate?: string
}

export function useActivityLogsByUser(
  userId: string | null,
  options: UseActivityLogsByUserOptions
): UseQueryResult<IPaginatedResponse<IActivityLogRes>> {
  const { page, limit, query, startDate, endDate } = options

  return useQuery({
    queryKey: ['activity-logs', 'user', userId, page, limit, query, startDate, endDate],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')
      const res = await activityLogService.getActivityLogsByUser(userId, page, limit, query, startDate, endDate)
      if (!res.success) throw new Error(res.message)
      return res as IPaginatedResponse<IActivityLogRes>
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}