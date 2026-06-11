import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { makeBackendRequest } from '../../backend'

export const getCustomersFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { jenis: number; search?: string; page?: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const sp = new URLSearchParams({
      jenis: String(data.jenis),
      search: data.search || '',
      page: String(data.page || 1),
    })
    const result = await makeBackendRequest(
      `/api/customers?${sp.toString()}`,
      { method: 'GET' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getPerkiraanFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { q?: string; without?: string; posthutpiut?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const sp = new URLSearchParams()
    if (data.q) sp.set('q', data.q)
    if (data.without) sp.set('without', data.without)
    if (data.posthutpiut) sp.set('posthutpiut', data.posthutpiut)
    const result = await makeBackendRequest(
      `/api/perkiraan?${sp.toString()}`,
      { method: 'GET' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getKelompokKasFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { type?: string; query?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const sp = new URLSearchParams({
      type: data.type || 'KAS',
      query: data.query || '',
    })
    const result = await makeBackendRequest(
      `/api/perkiraan/kelompok-kas?${sp.toString()}`,
      { method: 'GET' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })
