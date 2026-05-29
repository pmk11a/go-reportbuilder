import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

export const APIRoute = {
  POST: async ({ request }: { request: Request }) => {
    const result = await makeBackendRequest('/api/admin/activity-logs/configs', {
      method: 'POST',
      body: (request as any)._body
    }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  }
}
