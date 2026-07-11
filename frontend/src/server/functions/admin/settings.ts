import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { makeBackendRequest } from '../../backend'

export const getCompanySettingsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/admin/settings/company', { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const updateCompanySettingsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/admin/settings/company', {
      method: 'PUT',
      body: JSON.stringify(data.body),
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getNumberSettingsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/admin/settings/numbers', { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const updateNumberSettingsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/admin/settings/numbers', {
      method: 'PUT',
      body: JSON.stringify(data.body),
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getFeaturesSettingsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/admin/settings/features', { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })
