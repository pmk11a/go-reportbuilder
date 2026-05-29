import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

/**
 * GET /api/menus/sidebar
 * Fetches sidebar menu tree from the Go backend.
 */
export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const result = await makeBackendRequest('/api/menus/sidebar', {
      method: 'GET',
    }, request)

    const builder = new BffResponseBuilder(result.status)
    return builder.send(result.success, result.message, result.data)
  },
}
