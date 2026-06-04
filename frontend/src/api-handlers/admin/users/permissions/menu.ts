import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

/**
 * BFF proxy for the per-tab MENU permissions endpoint.
 * Frontend URL: GET /api/admin/users/permissions/menu?id={id}
 * Backend URL:  GET /api/admin/users/{id}/permissions/menu
 */
export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return new BffResponseBuilder(400).send(false, 'Missing required query parameter: id', null)
    }
    const result = await makeBackendRequest(
      `/api/admin/users/${id}/permissions/menu`,
      { method: 'GET' },
      request
    )
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },
}
