import { createMiddleware } from '@tanstack/react-start'
import { getRedisClient } from '../redis'

const RATE_LIMIT_MAX = 100
const RATE_LIMIT_WINDOW = 60

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const redis = getRedisClient()
    const key = `ratelimit:${ip}`

    const current = await redis.eval(
      `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      return current
      `,
      1,
      key,
      RATE_LIMIT_WINDOW
    ) as number

    if (current > RATE_LIMIT_MAX) {
      return { allowed: false, remaining: 0 }
    }

    return { allowed: true, remaining: RATE_LIMIT_MAX - current }
  } catch {
    return { allowed: true, remaining: 1 }
  }
}

function extractIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return '127.0.0.1'
}

export const rateLimitMiddleware = createMiddleware({ type: 'request' })
  .server(async ({ request, next }) => {
    const ip = extractIp(request)
    const { allowed, remaining } = await checkRateLimit(ip)

    if (!allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Rate limit exceeded',
          data: null,
          error_map: {
            code: 'RATE_LIMIT_EXCEEDED',
            error_name: 'Batas Request Tercapai',
            reason: 'Terlalu banyak request dalam waktu singkat.',
            action: 'Tunggu beberapa saat sebelum mencoba lagi.',
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
            'Retry-After': String(RATE_LIMIT_WINDOW),
          },
        }
      )
    }

    return next({ context: { rateLimitRemaining: remaining } })
  })
