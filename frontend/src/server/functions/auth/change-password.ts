import { createServerFn } from '@tanstack/react-start'
import { csrfMiddleware } from '../../middleware/csrf'
import { sessionMiddleware } from '../../middleware/session'
import { makeBackendRequest } from '../../backend'
import type { SessionData } from '../../session'

export const changePasswordFn = createServerFn({ method: 'POST' })
  .middleware([csrfMiddleware, sessionMiddleware])
  .validator((data: { current_password: string; new_password: string; confirm_password: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string; session: SessionData }

    const result = await makeBackendRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }, accessToken)

    if (!result.success) {
      throw new Error(result.message || 'Failed to change password')
    }

    return result.data
  })
