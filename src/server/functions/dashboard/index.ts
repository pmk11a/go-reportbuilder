import { createServerFn } from '@tanstack/react-start'
import { sessionMiddleware } from '../../middleware/session'
import { makeBackendRequest } from '../../backend'

export const getDashboardStatsFn = createServerFn({ method: 'GET' })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/dashboard/stats', { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getPensiunanWithoutFilesFn = createServerFn({ method: 'GET' })
  .middleware([sessionMiddleware])
  .validator((data: { query?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const url = data.query
      ? `/api/dashboard/pensiunan-without-files${data.query}`
      : '/api/dashboard/pensiunan-without-files'
    const result = await makeBackendRequest(url, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return { data: result.data, meta: result.meta }
  })
