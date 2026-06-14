import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { makeBackendRequest } from '../../backend'

export const getActivityLogsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { query?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const url = data.query ? `/api/admin/activity-logs${data.query}` : '/api/admin/activity-logs'
    const result = await makeBackendRequest(url, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return { data: result.data, meta: result.meta }
  })

export const getActivityLogConfigsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { query?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const url = data.query ? `/api/admin/activity-logs/configs${data.query}` : '/api/admin/activity-logs/configs'
    const result = await makeBackendRequest(url, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return { data: result.data, meta: result.meta }
  })

export const getActivityLogConfigDetailFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/activity-logs/configs/${data.id}`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getActivityLogsByUserFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { userId: string; page?: number; limit?: number; query?: string; startDate?: string; endDate?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const params = new URLSearchParams()
    params.set('pemakai', data.userId)
    if (data.page) params.set('page', String(data.page))
    if (data.limit) params.set('limit', String(data.limit))
    if (data.query) params.set('query', data.query)
    if (data.startDate) params.set('start_date', data.startDate)
    if (data.endDate) params.set('end_date', data.endDate)
    const result = await makeBackendRequest(`/api/admin/activity-logs?${params}`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return { data: result.data, meta: result.meta }
  })
