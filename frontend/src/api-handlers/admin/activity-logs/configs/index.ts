import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

export const APIRoute = {
  POST: async ({ request }: { request: Request }) => {
    // Extract body from dispatcher's attached _body
    const body = (request as any)._body || ''

    console.log('[BFF] POST /admin/activity-logs/configs - Body:', body)

    // Validate body is not empty
    if (!body) {
      console.warn('[BFF] POST /admin/activity-logs/configs - Empty body')
      return new BffResponseBuilder(400).send(false, 'Request body is required', null)
    }

    // Ensure body is string for backend
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)

    const result = await makeBackendRequest(
      '/api/admin/activity-logs/configs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: bodyStr,
      },
      request
    )

    console.log('[BFF] POST response:', result.status, result.message)
    return new BffResponseBuilder(result.status).send(result.success, result.message, result.data)
  },
}


