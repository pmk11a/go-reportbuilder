import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

let redisClient: Redis | null = null

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 200, 3000)
      },
      lazyConnect: false,
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
