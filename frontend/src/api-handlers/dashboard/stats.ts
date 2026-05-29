import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

/**
 * GET /api/dashboard/stats
 * Fetches dashboard statistics from the Go backend.
 */
export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const result = await makeBackendRequest('/api/dashboard/stats', {
      method: 'GET',
    }, request)

    const builder = new BffResponseBuilder(result.status)
    return builder.send(result.success, result.message, result.data)
  },
}
