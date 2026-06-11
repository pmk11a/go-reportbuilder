import { useQuery } from '@tanstack/react-query'
import { userService } from '@/domains/users/services/userService'
import type { IUser } from '@/domains/users/types/user'

/**
 * useUserById fetches a single user by ID.
 * Used in detail and edit pages.
 */
export function useUserById(userId: string) {
  return useQuery({
    queryKey: ['users', 'detail', userId],
    queryFn: async () => {
      const response = await userService.getById(userId)
      if (!response.success) throw new Error(response.message)
      return response.data as IUser
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
