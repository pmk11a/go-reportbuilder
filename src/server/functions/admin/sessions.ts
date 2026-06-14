import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { makeBackendRequest } from '../../backend'

export const getUserSessionsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { userId: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/admin/users/${data.userId}/sessions`,
      { method: 'GET' },
      accessToken
    )
    return result
  })

export const revokeSessionFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { userId: string; sessionId: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/admin/users/${data.userId}/sessions/${data.sessionId}`,
      { method: 'DELETE' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const revokeAllSessionsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { userId: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/admin/users/${data.userId}/sessions`,
      { method: 'DELETE' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })
