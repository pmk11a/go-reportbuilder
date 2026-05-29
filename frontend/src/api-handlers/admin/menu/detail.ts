import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const kode = url.searchParams.get('kode')
    const result = await makeBackendRequest(`/api/admin/menu/${kode}`, { method: 'GET' }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },
  PUT: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const kode = url.searchParams.get('kode')
    const result = await makeBackendRequest(`/api/admin/menu/${kode}`, { 
      method: 'PUT',
      body: (request as any)._body
    }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },
  DELETE: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const kode = url.searchParams.get('kode')
    const result = await makeBackendRequest(`/api/admin/menu/${kode}`, { method: 'DELETE' }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  }
}
