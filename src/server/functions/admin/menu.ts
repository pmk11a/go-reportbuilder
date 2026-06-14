import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { makeBackendRequest } from '../../backend'

export const getMenuListFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { query?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const url = data.query ? `/api/admin/menu${data.query}` : '/api/admin/menu'
    const result = await makeBackendRequest(url, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return { data: result.data, meta: result.meta }
  })

export const getMenuDetailFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { kode: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/menu/${data.kode}`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const createMenuFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/admin/menu', {
      method: 'POST',
      body: JSON.stringify(data.body),
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const updateMenuFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { kode: string; body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/menu/${data.kode}`, {
      method: 'PUT',
      body: JSON.stringify(data.body),
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const deleteMenuFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { kode: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/menu/${data.kode}`, { method: 'DELETE' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getMenuParentsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/admin/menu/parents', { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })
