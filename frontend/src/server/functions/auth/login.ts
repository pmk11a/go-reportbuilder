import { createServerFn } from '@tanstack/react-start'
import { csrfMiddleware } from '../../middleware/csrf'
import { rateLimitMiddleware } from '../../middleware/rate-limit'
import { createSession, type SessionData } from '../../session'
import { makeBackendRequest } from '../../backend'

const SESSION_TTL = parseInt(process.env.SESSION_TTL_SECONDS || '604800', 10)

export const loginFn = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware, csrfMiddleware])
  .validator((data: { username: string; password: string }) => data)
  .handler(async ({ data }) => {
    const result = await makeBackendRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!result.success) {
      throw new Error(result.message || 'Login failed')
    }

    const { access_token, refresh_token, expires_at, user } = result.data || {}

    if (!access_token || !refresh_token) {
      throw new Error('Invalid response from auth service')
    }

    const sessionData: SessionData = {
      userId: String(user?.id || ''),
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: expires_at,
      user,
    }
    const sessionId = await createSession(sessionData)

    return {
      user,
      sessionId,
      maxAge: SESSION_TTL,
    }
  })
