import { createServerFn } from '@tanstack/react-start'
import { getCookie, deleteCookie } from '@tanstack/start-server-core'
import { destroySession } from '../../session'

export const logoutFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    const sessionId = getCookie('session_id')
    if (sessionId) {
      await destroySession(sessionId)
    }

    deleteCookie('session_id', {
      httpOnly: true,
      path: '/',
    })

    return { success: true }
  })
