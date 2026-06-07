import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionService, type ISessionInfo, type ISessionListResponse } from '@/services/sessionService'
import { useToast } from '@/hooks/use-toast'
import { formatAPIError } from '@/utils/errorMapper'

/**
 * Session data with current session indicator.
 */
interface ISessionsData {
  sessions: ISessionInfo[]
  currentSessionId: string
}

/**
 * useUserSessions fetches the list of active sessions for a specific user.
 * Returns sessions array and the current session ID for highlighting.
 * Cache key: ['sessions', userId]
 * Refetch on tab focus or manual invalidation.
 */
export function useUserSessions(userId?: string | number) {
  const { toast } = useToast()

  return useQuery({
    queryKey: ['sessions', userId],
    queryFn: async (): Promise<ISessionsData> => {
      if (!userId) return { sessions: [], currentSessionId: '' }
      try {
        const response = await sessionService.getUserSessions(userId)
        if (!response || !response.data) {
          throw new Error('Invalid response format')
        }
        const data = response.data as ISessionListResponse
        return {
          sessions: data.sessions || [],
          currentSessionId: data.current_session_id || '',
        }
      } catch (error: any) {
        const errorMsg = error.response
          ? formatAPIError(error.response.status, error.message)
          : error.message || 'Failed to fetch sessions'
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        })
        throw error
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * useRevokeSession revokes a single session (force logout from one device).
 * On success, invalidates the session list for the user.
 */
export function useRevokeSession(userId?: string | number) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!userId) throw new Error('userId is required')
      const response = await sessionService.revokeSession(userId, sessionId)
      return response
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Session revoked successfully',
        variant: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['sessions', userId] })
    },
    onError: (error: any) => {
      const errorMsg = error.response
        ? formatAPIError(error.response.status, error.message)
        : error.message
      toast({
        title: 'Error',
        description: errorMsg || 'Failed to revoke session',
        variant: 'destructive',
      })
    },
  })
}

/**
 * useRevokeAllSessions revokes all sessions for a user (force logout from all devices).
 * On success, invalidates the session list for the user.
 */
export function useRevokeAllSessions(userId?: string | number) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('userId is required')
      const response = await sessionService.revokeAllSessions(userId)
      return response
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'All sessions revoked successfully',
        variant: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['sessions', userId] })
    },
    onError: (error: any) => {
      const errorMsg = error.response
        ? formatAPIError(error.response.status, error.message)
        : error.message
      toast({
        title: 'Error',
        description: errorMsg || 'Failed to revoke all sessions',
        variant: 'destructive',
      })
    },
  })
}
