import { useQuery } from '@tanstack/react-query'
import { makeBackendRequest } from '@/server/backend'

export const useUserLevels = () => {
  return useQuery({
    queryKey: ['user-levels'],
    queryFn: async () => {
      const response = await makeBackendRequest('/api/user-levels', { method: 'GET' })
      return response
    },
  })
}
