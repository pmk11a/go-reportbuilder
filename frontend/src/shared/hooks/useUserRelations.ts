import { useQuery } from '@tanstack/react-query'
import { makeBackendRequest } from '@/server/backend'

export const useUserRelations = () => {
  return useQuery({
    queryKey: ['user-relations'],
    queryFn: async () => {
      const response = await makeBackendRequest('/api/user-relations', { method: 'GET' })
      return response
    },
  })
}
