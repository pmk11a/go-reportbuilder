/**
 * BFF Redis Client — Server-side Only
 *
 * Singleton Redis client for BFF session storage.
 * Uses ioredis (industry standard Node.js Redis client).
 *
 * WARNING: This file must NEVER be imported from client-side code.
 */
import Redis from 'ioredis'
import { getEnv } from './utils'

const REDIS_URL = getEnv('REDIS_URL', 'redis://localhost:6379')

let redisClient: Redis | null = null

/**
 * Get or create the Redis client singleton.
 * Lazy initialization to avoid connecting during Vite's client bundle.
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        // Exponential backoff: 200ms, 400ms, 800ms, max 3s
        const delay = Math.min(times * 200, 3000)
        return delay
      },
      lazyConnect: false,
    })

    redisClient.on('connect', () => {
      console.log('[BFF Redis] Connected to Redis')
    })

    redisClient.on('error', (err) => {
      console.error('[BFF Redis] Redis error:', err.message)
    })
  }

  return redisClient
}
