import { makeBackendRequest, BffResponseBuilder, parseEnvTime } from '@/bff/utils'
import { createSession, type SessionData } from '@/bff/session'

/**
 * BFF API Route: POST /api/auth/login
 *
 * Flow:
 * 1. Forward credentials to Golang backend
 * 2. Golang returns access_token + refresh_token
 * 3. BFF generates a random Session ID
 * 4. BFF stores tokens in Redis (key: bff:session:{sessionId})
 * 5. BFF sets Session ID as HttpOnly cookie (browser never sees JWT)
 */
export const APIRoute = {
  POST: async ( { request }: { request: Request } ) => {
    const rawBody = (request as any)._body
    if ( !rawBody ) {
      return BffResponseBuilder.error('Invalid request body', 400)
    }

    // 1. Forward login to Golang backend (no session needed — this IS the login)
    const result = await makeBackendRequest( '/api/auth/login', {
      method: 'POST',
      body: rawBody,
    } )

    if (!result.success) {
      return BffResponseBuilder.error(result.message, result.status)
    }

    // 2. Extract tokens from Golang response
    const { access_token, refresh_token, expires_at, user } = result.data || {}

    if (!access_token || !refresh_token) {
      return BffResponseBuilder.error('Invalid response from auth service', 500)
    }

    // 3. Create Redis session (JWT is stored server-side, never sent to browser)
    const sessionData: SessionData = {
      userId: String(user?.id || ''),
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: expires_at,
      user,
    }
    const sessionId = await createSession(sessionData)

    // Max-Age from env (defaults to 7 days, supports math expressions)
    const sessionTtl = parseEnvTime('SESSION_TTL_SECONDS', 604800)
    const builder = new BffResponseBuilder(200)
    builder.setCookie('session_id', sessionId, sessionTtl)

    // 5. Return user data only (NO tokens in response body)
    return builder.send(true, 'Login successful', { user })
  }
}
