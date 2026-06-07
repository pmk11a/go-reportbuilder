import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

/**
 * BFF handler for session management endpoints
 * GET /api/admin/users/{userId}/sessions - List active sessions
 * DELETE /api/admin/users/{userId}/sessions - Revoke all sessions
 * DELETE /api/admin/users/{userId}/sessions/{sessionId} - Revoke specific session
 *
 * This handler is called for paths like:
 * - /api/admin/users/SA/sessions → userId = SA, sessionId = undefined
 * - /api/admin/users/SA/sessions/xyz → userId = SA, sessionId = xyz
 *
 * The BFF dispatcher routes these paths to this handler by matching the
 * "sessions" segment and extracting the userId from the URL.
 */
export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    // pathParts after /api/admin/users/SA/sessions = ["api", "admin", "users", "SA", "sessions"]
    // userId is at index 3, sessionId is at index 5 (if present)
    const userId = pathParts[3]

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
    const pathParts = url.pathname.split('/').filter(Boolean)
    const userId = pathParts[3]
    const sessionId = pathParts[5] // If present: /api/admin/users/{userId}/sessions/{sessionId}

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
