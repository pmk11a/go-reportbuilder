import { getRedisClient } from './redis'

const RATE_LIMIT_MAX_REQUESTS = 100
const RATE_LIMIT_WINDOW_SECONDS = 60

/**
 * Basic Token Bucket / Fixed Window rate limiter using Redis.
 * Limits requests per IP address.
 */
export async function checkRateLimit(ip: string): Promise<{ allowed: boolean, remaining: number }> {
  try {
    const redis = getRedisClient()
    const key = `ratelimit:${ip}`

    // Increment request count
    const current = await redis.incr(key)
    
    // Set expiry on first request in the window
    if (current === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS)
    }

    if (current > RATE_LIMIT_MAX_REQUESTS) {
      return { allowed: false, remaining: 0 }
    }

    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current }
  } catch (err) {
    // Fail-open if Redis is down
    console.warn('[BFF RateLimit] Redis failure, bypassing rate limit:', err)
    return { allowed: true, remaining: 1 }
  }
}
