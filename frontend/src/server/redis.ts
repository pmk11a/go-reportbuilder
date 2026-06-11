import Redis from 'ioredis'
import { getEnv } from './utils'

const REDIS_URL = getEnv('REDIS_URL', 'redis://localhost:6379')

let redisClient: Redis | null = null

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) return null
        return Math.min(times * 200, 2000)
      },
    })

    redisClient.on('connect', () => {
      console.log('[Server] Redis connected')
    })

    redisClient.on('error', (err) => {
      console.error('[Server] Redis error:', err.message)
    })
  }

  return redisClient
}
