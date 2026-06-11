import { randomUUID } from 'crypto'
import { getRedisClient } from './redis'
import { getEnv, parseEnvTime } from './utils'

const SESSION_PREFIX = 'bff:session:'
const LOCK_PREFIX = 'lock:refresh:'
const SESSION_TTL_SECONDS = parseEnvTime('SESSION_TTL_SECONDS', 604800)
const BACKEND_URL = getEnv('BACKEND_URL', 'http://127.0.0.1:8080')
const BACKEND_TIMEOUT = parseEnvTime('BFF_BACKEND_TIMEOUT', 10000)

export interface SessionData {
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: any
}

export async function createSession(data: SessionData): Promise<string> {
  const redis = getRedisClient()
  const sessionId = randomUUID()
  await redis.set(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(data), 'EX', SESSION_TTL_SECONDS)
  // Add session to user's session set for backend queries (SMEMBERS bff:user_sessions:{userId})
  await redis.sadd(`bff:user_sessions:${data.userId}`, sessionId)
  await redis.expire(`bff:user_sessions:${data.userId}`, SESSION_TTL_SECONDS)
  console.log(`[BFF Session] Created session ${sessionId} for user ${data.userId}`)
  return sessionId
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const redis = getRedisClient()
  const raw = await redis.get(`${SESSION_PREFIX}${sessionId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionData
  } catch {
    return null
  }
}

export async function updateSession(sessionId: string, data: SessionData): Promise<void> {
  const redis = getRedisClient()
  const key = `${SESSION_PREFIX}${sessionId}`
  const ttl = await redis.ttl(key)
  const remainingTtl = ttl > 0 ? ttl : SESSION_TTL_SECONDS
  await redis.set(key, JSON.stringify(data), 'EX', remainingTtl)
  // Refresh the user's session set expiry to match the session's TTL
  await redis.expire(`bff:user_sessions:${data.userId}`, remainingTtl)
}

export async function destroySession(sessionId: string): Promise<void> {
  const redis = getRedisClient()
  const session = await getSession(sessionId)
  await redis.del(`${SESSION_PREFIX}${sessionId}`)
  if (session) {
    // Remove session from user's session set
    await redis.srem(`bff:user_sessions:${session.userId}`, sessionId)
  }
  console.log(`[BFF Session] Destroyed session ${sessionId}`)
}

export async function getValidAccessToken(sessionId: string): Promise<string | null> {
  const session = await getSession(sessionId)
  if (!session) return null

  if (Date.now() < session.expiresAt) {
    return session.accessToken
  }

  const redis = getRedisClient()
  const lockKey = `${LOCK_PREFIX}${session.userId}`
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  for (let attempt = 0; attempt < 15; attempt++) {
    const acquired = await redis.set(lockKey, 'LOCKED', 'EX', 10, 'NX')

    if (acquired === 'OK') {
      try {
        const freshSession = await getSession(sessionId)
        if (freshSession && Date.now() < freshSession.expiresAt) {
          return freshSession.accessToken
        }
        if (!freshSession) return null

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT)

        let response: Response
        try {
          response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: freshSession.refreshToken }),
            signal: controller.signal,
          })
        } catch {
          console.error('[BFF Session] Token refresh request failed/timed out')
          await destroySession(sessionId)
          return null
        } finally {
          clearTimeout(timeoutId)
        }

        if (!response.ok) {
          console.error('[BFF Session] Token refresh failed, destroying session')
          await destroySession(sessionId)
          return null
        }

        const result = await response.json()
        const tokenData = result.data

        const updated: SessionData = {
          userId: freshSession.userId,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: tokenData.expires_at,
          user: tokenData.user || freshSession.user,
        }
        await updateSession(sessionId, updated)
        console.log(`[BFF Session] Token refreshed for user ${freshSession.userId}`)
        return updated.accessToken
      } finally {
        await redis.del(lockKey)
      }
    } else {
      await sleep(200)
      const updated = await getSession(sessionId)
      if (updated && Date.now() < updated.expiresAt) {
        return updated.accessToken
      }
    }
  }

  console.error('[BFF Session] Timeout waiting for token refresh')
  return null
}
