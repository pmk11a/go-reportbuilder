import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

/**
 * POST /api/auth/change-password
 * Changes the user's password in the Go backend.
 */
export const APIRoute = {
  POST: async ({ request }: { request: Request }) => {
    try {
      const body = await request.clone().json()
      const result = await makeBackendRequest('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }, request)

      const builder = new BffResponseBuilder(result.status)
      return builder.send(result.success, result.message, result.data)
    } catch (error: any) {
      const builder = new BffResponseBuilder(400)
      return builder.send(false, error.message || 'Invalid change password request')
    }
  },
}
