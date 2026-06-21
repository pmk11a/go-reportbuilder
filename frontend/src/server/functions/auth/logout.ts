import { createServerFn } from '@tanstack/react-start'
import { getCookie, deleteCookie } from '@tanstack/start-server-core'
import { destroySession, SESSION_COOKIE_NAME } from '../../session'

export const logoutFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    const sessionId = getCookie(SESSION_COOKIE_NAME)
    if (sessionId) {
      await destroySession(sessionId)
    }

    deleteCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      path: '/',
    })

    return { success: true }
  })
