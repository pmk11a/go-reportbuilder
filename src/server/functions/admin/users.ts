import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { makeBackendRequest } from '../../backend'

export const getUsersFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { query?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const url = data.query ? `/api/admin/users${data.query}` : '/api/admin/users'
    const result = await makeBackendRequest(url, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return { data: result.data, meta: result.meta }
  })

export const getUserDetailFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/users/${data.id}`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const createUserFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data.body),
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const updateUserFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/users/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data.body),
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const deleteUserFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/users/${data.id}`, { method: 'DELETE' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getUserPermissionsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { id: string; type?: 'menu' | 'report' | 'coa' }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const path = data.type
      ? `/api/admin/users/${data.id}/permissions/${data.type}`
      : `/api/admin/users/${data.id}/permissions`
    const result = await makeBackendRequest(path, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const updateUserPermissionsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/users/${data.id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(data.body),
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getUserSessionsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { userId: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/users/${data.userId}/sessions`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const revokeUserSessionFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { userId: string; sessionId?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const path = data.sessionId
      ? `/api/admin/users/${data.userId}/sessions/${data.sessionId}`
      : `/api/admin/users/${data.userId}/sessions`
    const result = await makeBackendRequest(path, { method: 'DELETE' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })
