import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { makeBackendRequest } from '../../backend'

export const getDatabaseTablesFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/admin/database/tables', { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getDatabaseColumnsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { table: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/database/tables/${data.table}/columns`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })
