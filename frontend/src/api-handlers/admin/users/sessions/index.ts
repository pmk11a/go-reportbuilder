import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

/**
 * BFF handler for GET /api/admin/users/{userId}/sessions
 * Proxies to backend session listing endpoint.
 */
export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return new BffResponseBuilder(400).send(false, 'Missing userId parameter', null)
    }

    const result = await makeBackendRequest(
      `/api/admin/users/${userId}/sessions`,
      { method: 'GET' },
      request
    )
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },
}
