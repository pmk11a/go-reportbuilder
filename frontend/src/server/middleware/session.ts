import { createMiddleware } from '@tanstack/react-start'
import { getSession, getValidAccessToken, type SessionData } from '../session'

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? match[1] : null
}

export const sessionMiddleware = createMiddleware({ type: 'request' })
  .server(async ({ request, next }) => {
    const sessionId = getCookie(request, 'session_id')

    if (!sessionId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Unauthorized',
          data: null,
          error_map: {
            code: 'UNAUTHORIZED',
            error_name: 'Akses Ditolak',
            reason: 'Sesi tidak ditemukan. Anda belum login.',
            action: 'Silakan login kembali untuk melanjutkan.',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const session = await getSession(sessionId)
    if (!session) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Session expired',
          data: null,
          error_map: {
            code: 'TOKEN_EXPIRED',
            error_name: 'Sesi Berakhir',
            reason: 'Sesi Anda telah berakhir atau tidak valid.',
            action: 'Silakan login kembali.',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = await getValidAccessToken(sessionId)
    if (!accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Token refresh failed',
          data: null,
          error_map: {
            code: 'TOKEN_INVALID',
            error_name: 'Token Tidak Valid',
            reason: 'Gagal memperbarui token akses.',
            action: 'Silakan login kembali.',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return next({
      context: {
        sessionId,
        session,
        accessToken,
      },
    })
  })
