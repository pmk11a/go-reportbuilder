import { createServerFn } from '@tanstack/react-start'
import { sessionMiddleware } from '../../middleware/session'
import { makeBackendRequest } from '../../backend'

export const getPeriodeFn = createServerFn({ method: 'GET' })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/berkas/get-periode', { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const setPeriodeFn = createServerFn({ method: 'POST' })
  .middleware([sessionMiddleware])
  .validator((data: { body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/berkas/set-periode', {
      method: 'PUT',
      body: JSON.stringify(data.body),
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })
