import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const result = await makeBackendRequest(`/api/admin/users${url.search}`, { method: 'GET' }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },
  POST: async ({ request }: { request: Request }) => {
    const result = await makeBackendRequest('/api/admin/users', {
      method: 'POST',
      body: (request as any)._body
    }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  }
}
