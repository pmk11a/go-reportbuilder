import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

/**
 * BFF handler for session management endpoints
 * GET /api/admin/users/{userId}/sessions - List active sessions
 * DELETE /api/admin/users/{userId}/sessions - Revoke all sessions
 * DELETE /api/admin/users/{userId}/sessions/{sessionId} - Revoke specific session
 */
export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const userId = pathParts[4] // Extract from /api/admin/users/{userId}/sessions

    if (!userId) {
      return new BffResponseBuilder(400).send(false, 'User ID is required', null)
    }

    const result = await makeBackendRequest(
      `/api/admin/users/${userId}/sessions`,
      { method: 'GET' },
      request
    )
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },

  DELETE: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const userId = pathParts[4]
    const sessionId = pathParts[6] // If present: /api/admin/users/{userId}/sessions/{sessionId}

    if (!userId) {
      return new BffResponseBuilder(400).send(false, 'User ID is required', null)
    }

    const backendUrl = sessionId
      ? `/api/admin/users/${userId}/sessions/${sessionId}`
      : `/api/admin/users/${userId}/sessions`

    const result = await makeBackendRequest(
      backendUrl,
      { method: 'DELETE' },
      request
    )
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },
}
