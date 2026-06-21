import { createMiddleware } from '@tanstack/react-start'
import { getCookie } from '@tanstack/start-server-core'
import { getSession, getValidAccessToken, SESSION_COOKIE_NAME, type SessionData } from '../session'

export const sessionMiddleware = createMiddleware({ type: 'request' })
  .server(async ({ next }) => {
    const sessionId = getCookie(SESSION_COOKIE_NAME)

    if (!sessionId) {
      throw new Error('Unauthorized: No session')
    }

    const session = await getSession(sessionId)
    if (!session) {
      throw new Error('Session expired')
    }

    const accessToken = await getValidAccessToken(sessionId)
    if (!accessToken) {
      throw new Error('Token refresh failed')
    }

    return next({
      context: {
        sessionId,
        session,
        accessToken,
      },
    })
  })
