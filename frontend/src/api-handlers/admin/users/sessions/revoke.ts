import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

/**
 * BFF handler for DELETE /api/admin/users/{userId}/sessions or
 * DELETE /api/admin/users/{userId}/sessions/{sessionId}
 * Proxies to backend session revocation endpoints.
 */
export const APIRoute = {
  DELETE: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const sessionId = url.searchParams.get('sessionId')

    if (!userId) {
      return new BffResponseBuilder(400).send(false, 'Missing userId parameter', null)
    }

    // Construct the backend endpoint based on whether sessionId is provided
    const backendPath = sessionId
      ? `/api/admin/users/${userId}/sessions/${sessionId}`
      : `/api/admin/users/${userId}/sessions`

    const result = await makeBackendRequest(
      backendPath,
      { method: 'DELETE' },
      request
    )
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },
}
