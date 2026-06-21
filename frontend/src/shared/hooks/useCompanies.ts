import { useQuery } from '@tanstack/react-query'
import { makeBackendRequest } from '@/server/backend'

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await makeBackendRequest('/api/companies', { method: 'GET' })
      return response
    },
  })
}
