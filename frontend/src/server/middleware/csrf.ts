import { createMiddleware } from '@tanstack/react-start'
import { createHmac } from 'crypto'

const BFF_SECRET = process.env.BFF_INTERNAL_SECRET || 'dapen-bff-internal-secret-change-in-production'
const TOKEN_TTL_MS = parseInt(process.env.CSRF_TOKEN_TTL_MS || '1800000', 10)

export function generateCsrfToken(): string {
  const timestamp = Date.now().toString()
  const signature = createHmac('sha256', BFF_SECRET)
    .update(timestamp)
    .digest('hex')
  return `${timestamp}.${signature}`
}

export function validateCsrfToken(token: string | null | undefined): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [timestamp, signature] = parts
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts)) return false
  if (Date.now() - ts > TOKEN_TTL_MS) return false

  const expected = createHmac('sha256', BFF_SECRET)
    .update(timestamp)
    .digest('hex')

  if (signature.length !== expected.length) return false

  let mismatch = 0
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i)
  }

  return mismatch === 0
}

export const csrfMiddleware = createMiddleware({ type: 'request' })
  .server(async ({ request, next }) => {
    const csrfToken = request.headers.get('x-csrf-token')
    if (!validateCsrfToken(csrfToken)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'CSRF validation failed',
          data: null,
          error_map: {
            code: 'FORBIDDEN',
            error_name: 'Akses Ditolak',
            reason: 'Token CSRF tidak valid atau telah kadaluarsa.',
            action: 'Muat ulang halaman dan coba lagi.',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return next({ context: { csrfValid: true } })
  })
