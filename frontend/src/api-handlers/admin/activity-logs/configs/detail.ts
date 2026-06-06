import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

/**
 * BFF handler for GET /api/admin/activity-logs/configs/detail?tableName=...
 * Proxies to backend GET /api/admin/activity-logs/configs/:table_name
 */
export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const tableName = url.searchParams.get('tableName')

    if (!tableName) {
      return new BffResponseBuilder(400).send(false, 'tableName parameter is required', null)
    }

    // Backend endpoint uses path param: /api/admin/activity-logs/configs/{table_name}
    const result = await makeBackendRequest(
      `/api/admin/activity-logs/configs/${encodeURIComponent(tableName)}`,
      { method: 'GET' },
      request
    )

    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },
}

