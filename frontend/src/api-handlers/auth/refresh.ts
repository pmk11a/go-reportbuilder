import { BffResponseBuilder, getCookie } from '@/bff/utils'
import { getValidAccessToken, getSession } from '@/bff/session'

/**
 * BFF API Route: POST /api/auth/refresh
 *
 * This endpoint is called by the frontend when it receives a 401.
 * The actual refresh logic (with concurrency lock) is handled by
 * getValidAccessToken() in the session module.
 *
 * Flow:
 * 1. Read session_id from cookie
 * 2. Call getValidAccessToken() which:
 *    a. Checks if token is still valid → return it
 *    b. If expired → acquire Redis lock → refresh via Golang → update Redis → release lock
 *    c. If lock is held by another request → wait → read fresh token from Redis
 * 3. Return success/failure to frontend
 */
export const APIRoute = {
  POST: async ({ request }: { request: Request }) => {
    // 1. Get session ID from cookie
    const sessionId = getCookie(request, 'session_id')

    if (!sessionId) {
      return BffResponseBuilder.error('No session found', 401)
    }

    // 2. Attempt to get a valid access token (handles refresh + locking internally)
    const accessToken = await getValidAccessToken(sessionId)

    if (!accessToken) {
      // Session is dead — refresh failed or session expired
      return new BffResponseBuilder(401)
        .clearCookie('session_id')
        .send(false, 'Session expired. Please login again.', null)
    }

    // 3. Token is valid (either still fresh or just refreshed)
    // Get updated session data to return user info
    const session = await getSession(sessionId)

    return BffResponseBuilder.success('Token refreshed successfully', {
      user: session?.user || null,
    })
  },
}
