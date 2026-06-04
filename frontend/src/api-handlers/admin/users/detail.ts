import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const result = await makeBackendRequest(`/api/admin/users/${id}`, { method: 'GET' }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },
  PUT: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const result = await makeBackendRequest(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: (request as any)._body
    }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },
  DELETE: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const result = await makeBackendRequest(`/api/admin/users/${id}`, { method: 'DELETE' }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  }
}
