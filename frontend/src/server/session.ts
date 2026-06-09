import { randomUUID } from 'crypto'
import { getRedisClient } from './redis'

const SESSION_PREFIX = 'bff:session:'
const LOCK_PREFIX = 'lock:refresh:'
const SESSION_TTL_SECONDS = parseInt(process.env.SESSION_TTL_SECONDS || '604800', 10)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'
const BACKEND_TIMEOUT = parseInt(process.env.BFF_BACKEND_TIMEOUT || '10000', 10)

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
}

export async function destroySession(sessionId: string): Promise<void> {
  const redis = getRedisClient()
  await redis.del(`${SESSION_PREFIX}${sessionId}`)
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
          await destroySession(sessionId)
          return null
        } finally {
          clearTimeout(timeoutId)
        }

        if (!response.ok) {
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

  return null
}
