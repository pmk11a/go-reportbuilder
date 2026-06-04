import { getRedisClient } from './redis'

const RATE_LIMIT_MAX_REQUESTS = 100
const RATE_LIMIT_WINDOW_SECONDS = 60

/**
 * Enterprise-grade Fixed Window Rate Limiter using Redis.
 * Evaluates an atomic Lua script to guarantee increment and expiration,
 * preventing race conditions and orphan keys.
 */
export async function checkRateLimit(ip: string): Promise<{ allowed: boolean, remaining: number }> {
  try {
    const redis = getRedisClient()
    const key = `ratelimit:${ip}`

    // Atomic increment and expiration using Lua script
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
      RATE_LIMIT_WINDOW_SECONDS
    ) as number

    if (current > RATE_LIMIT_MAX_REQUESTS) {
      return { allowed: false, remaining: 0 }
    }

    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current }
  } catch (err) {
    // Fail-open if Redis is down (Enterprise Rule #5)
    console.warn('[BFF RateLimit] Redis failure, bypassing rate limit:', err)
    return { allowed: true, remaining: 1 }
  }
}
