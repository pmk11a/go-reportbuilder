import { makeBackendRequest, BffResponseBuilder, getCookie } from '@/bff/utils'
import { getSession } from '@/bff/session'

/**
 * BFF API Route: GET /api/auth/me
 *
 * Flow:
 * 1. Read session_id from HttpOnly cookie
 * 2. Lookup session in Redis
 * 3. If valid, forward to Golang /api/me with JWT from Redis
 * 4. Return user data to browser
 */
export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    // 1. Get session ID from cookie
    const sessionId = getCookie(request, 'session_id')

    if (!sessionId) {
      return BffResponseBuilder.error('Not authenticated', 401)
    }

    // 2. Check if session exists in Redis
    const session = await getSession(sessionId)

    if (!session) {
      // Session expired or doesn't exist
      return new BffResponseBuilder(401)
        .clearCookie('session_id')
        .send(false, 'Session expired', null)
    }

    // 3. Forward to Golang backend with JWT from Redis session
    // makeBackendRequest will automatically resolve JWT via getValidAccessToken
    const result = await makeBackendRequest('/api/me', { method: 'GET' }, request)

    if (!result.success) {
      // If backend says unauthorized, the session is stale — clean up
      if (result.status === 401) {
        return new BffResponseBuilder(401)
          .clearCookie('session_id')
          .send(false, 'Session expired', null)
      }
    }

    // 4. Merge backend /me data with session user data for a complete response
    const userData = result.data || session.user

    const builder = new BffResponseBuilder(result.status)
    return builder.send(result.success, result.message, userData)
  },
}
