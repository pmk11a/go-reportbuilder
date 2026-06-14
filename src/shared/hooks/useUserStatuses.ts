import { useQuery } from '@tanstack/react-query'
import { makeBackendRequest } from '@/server/backend'

export const useUserStatuses = () => {
  return useQuery({
    queryKey: ['user-statuses'],
    queryFn: async () => {
      const response = await makeBackendRequest('/api/user-statuses', { method: 'GET' })
      return response
    },
  })
}
