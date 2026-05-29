import { BffResponseBuilder, getCookie } from '@/bff/utils'
import { destroySession } from '@/bff/session'

/**
 * BFF API Route: POST /api/auth/logout
 *
 * Flow:
 * 1. Read session_id from HttpOnly cookie
 * 2. Destroy the Redis session (instant revocation — this is the power of server-side sessions)
 * 3. Clear the session_id cookie
 */
export const APIRoute = {
  POST: async ( { request }: { request: Request } ) => {
    // 1. Get session ID from cookie
    const sessionId = getCookie(request, 'session_id')

    // 2. Destroy Redis session if exists
    if (sessionId) {
      await destroySession(sessionId)
    }

    // 3. Clear all session cookies
    return new BffResponseBuilder(200)
      .clearCookie('session_id')
      .clearCookie('access_token')   // Clean up legacy cookies if any
      .clearCookie('refresh_token')  // Clean up legacy cookies if any
      .send(true, 'Logged out successfully', null)
  },
}
