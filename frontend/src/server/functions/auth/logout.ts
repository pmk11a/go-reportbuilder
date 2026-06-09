import { createServerFn } from '@tanstack/react-start'
import { csrfMiddleware } from '../../middleware/csrf'
import { sessionMiddleware } from '../../middleware/session'
import { destroySession } from '../../session'

export const logoutFn = createServerFn({ method: 'POST' })
  .middleware([csrfMiddleware, sessionMiddleware])
  .handler(async ({ context }) => {
    const { sessionId } = context as { sessionId: string }
    await destroySession(sessionId)
    return { success: true }
  })
