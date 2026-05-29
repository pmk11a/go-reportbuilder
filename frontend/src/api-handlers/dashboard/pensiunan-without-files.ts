import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

/**
 * GET /api/dashboard/pensiunan-without-files
 * Fetches list of retired employees without uploaded files from Go backend.
 */
export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const result = await makeBackendRequest('/api/dashboard/pensiunan-without-files', {
      method: 'GET',
    }, request)

    const builder = new BffResponseBuilder(result.status)
    return builder.send(result.success, result.message, result.data)
  },
}
