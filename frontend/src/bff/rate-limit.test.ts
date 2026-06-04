import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit } from './rate-limit'
import { getRedisClient } from './redis'

vi.mock('./redis', () => {
  const mockRedis = {
    eval: vi.fn(),
  }
  return {
    getRedisClient: () => mockRedis,
  }
})

describe('BFF checkRateLimit', () => {
  const redis = getRedisClient()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows request when current count is within limits', async () => {
    vi.mocked(redis.eval).mockResolvedValue(1) // first request

    const res = await checkRateLimit('127.0.0.1')
    expect(res.allowed).toBe(true)
    expect(res.remaining).toBe(99)
    expect(redis.eval).toHaveBeenCalledTimes(1)
  })

  it('blocks request when limit is exceeded', async () => {
    vi.mocked(redis.eval).mockResolvedValue(101) // exceeds limit of 100

    const res = await checkRateLimit('127.0.0.2')
    expect(res.allowed).toBe(false)
    expect(res.remaining).toBe(0)
    expect(redis.eval).toHaveBeenCalledTimes(1)
  })

  it('fails open and bypasses rate limit when Redis throws an error', async () => {
    vi.mocked(redis.eval).mockRejectedValue(new Error('Redis connection lost'))

    const res = await checkRateLimit('127.0.0.3')
    expect(res.allowed).toBe(true)
    expect(res.remaining).toBe(1)
    expect(redis.eval).toHaveBeenCalledTimes(1)
  })
})
