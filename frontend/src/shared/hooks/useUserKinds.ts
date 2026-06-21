import { useQuery } from '@tanstack/react-query'
import { makeBackendRequest } from '@/server/backend'

export const useUserKinds = () => {
  return useQuery({
    queryKey: ['user-kinds'],
    queryFn: async () => {
      const response = await makeBackendRequest('/api/user-kinds', { method: 'GET' })
      return response
    },
  })
}
