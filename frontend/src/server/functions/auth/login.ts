import { createServerFn } from '@tanstack/react-start'
import { setCookie } from '@tanstack/start-server-core'
import { createSession, type SessionData } from '../../session'
import { makeBackendRequest } from '../../backend'
import { parseEnvTime } from '../../utils'

const SESSION_TTL = parseEnvTime('SESSION_TTL_SECONDS', 604800)
const IS_PROD = process.env.NODE_ENV === 'production'

export const loginFn = createServerFn({ method: 'POST' })
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

    setCookie('session_id', sessionId, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL,
    })

    return { user }
  })
