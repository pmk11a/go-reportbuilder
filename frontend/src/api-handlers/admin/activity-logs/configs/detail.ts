import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const tableName = url.searchParams.get('tableName')
    const result = await makeBackendRequest(`/api/admin/activity-logs/configs/${tableName}`, { method: 'GET' }, request)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  }
}
