import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const result = await makeBackendRequest('/api/admin/settings/company', { method: 'GET' }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },
  PUT: async ({ request }: { request: Request }) => {
    const result = await makeBackendRequest('/api/admin/settings/company', {
      method: 'PUT',
      body: (request as any)._body
    }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  }
}
