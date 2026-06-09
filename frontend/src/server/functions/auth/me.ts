import { createServerFn } from '@tanstack/react-start'
import { sessionMiddleware } from '../../middleware/session'
import { makeBackendRequest } from '../../backend'
import type { SessionData } from '../../session'

export const meFn = createServerFn({ method: 'GET' })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { accessToken, session } = context as {
      accessToken: string
      session: SessionData
    }

    const result = await makeBackendRequest('/api/me', { method: 'GET' }, accessToken)

    if (!result.success) {
      if (result.status === 401) {
        throw new Error('Session expired')
      }
      throw new Error(result.message || 'Failed to fetch user')
    }

    return result.data || session.user
  })
