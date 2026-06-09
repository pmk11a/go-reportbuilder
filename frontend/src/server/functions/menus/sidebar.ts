import { createServerFn } from '@tanstack/react-start'
import { sessionMiddleware } from '../../middleware/session'
import { makeBackendRequest } from '../../backend'

export const getSidebarMenuFn = createServerFn({ method: 'GET' })
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/menus/sidebar', { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })
