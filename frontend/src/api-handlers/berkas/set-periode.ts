import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

export const APIRoute = {
  PUT: async ({ request }: { request: Request }) => {
    const result = await makeBackendRequest('/api/berkas/set-periode', {
      method: 'PUT',
      body: (request as any)._body
    }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  }
}
