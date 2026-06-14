import { createServerFn } from '@tanstack/react-start'
import { sessionMiddleware } from '../../middleware/session'
import { getSession, type SessionData } from '../../session'

export const refreshFn = createServerFn({ method: 'POST' })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { sessionId, session } = context as {
      sessionId: string
      session: SessionData
    }

    const freshSession = await getSession(sessionId)

    return {
      user: freshSession?.user || session.user,
    }
  })
