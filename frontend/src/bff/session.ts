/**
 * BFF Session Manager — Redis-backed Session with Concurrency Lock
 *
 * Implements the professional BFF pattern:
 * - Browser holds only Session ID (HttpOnly cookie)
 * - JWT tokens are stored server-side in Redis
 * - Concurrency lock prevents race conditions during token refresh (RTR)
 *
 * Key Structure:
 *   bff:session:{sessionId} → JSON { userId, accessToken, refreshToken, expiresAt }
 *
 * Lock Structure:
 *   lock:refresh:{userId} → "LOCKED" (NX, EX 10s)
 */
import { randomUUID } from 'crypto'
import { getRedisClient } from './redis'
import { getEnv, parseEnvTime } from './utils'

const SESSION_PREFIX = 'bff:session:'
const LOCK_PREFIX = 'lock:refresh:'
const SESSION_TTL_SECONDS = parseEnvTime('SESSION_TTL_SECONDS', 604800)
const BACKEND_URL = getEnv('BACKEND_URL', 'http://localhost:8080')

/**
 * Session data stored in Redis.
 * This is what the BFF holds on behalf of the browser.
 */
export interface SessionData {
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: number // Unix timestamp (ms) when access_token expires
  user: any // IUser data from Golang backend
}

/**
 * Create a new session in Redis after successful login.
 * Returns the generated Session ID (to be set as HttpOnly cookie).
 */
export async function createSession(data: SessionData): Promise<string> {
  const redis = getRedisClient()
  const sessionId = randomUUID()
  const key = `${SESSION_PREFIX}${sessionId}`

  await redis.set(key, JSON.stringify(data), 'EX', SESSION_TTL_SECONDS)
  console.log(`[BFF Session] Created session ${sessionId} for user ${data.userId}`)

  return sessionId
}

/**
 * Get session data from Redis by Session ID.
 * Returns null if session doesn't exist or is expired.
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const redis = getRedisClient()
  const key = `${SESSION_PREFIX}${sessionId}`

  const raw = await redis.get(key)
  if (!raw) return null

  try {
    return JSON.parse(raw) as SessionData
  } catch {
    return null
  }
}

/**
 * Update an existing session in Redis (e.g., after token refresh).
 */
export async function updateSession(sessionId: string, data: SessionData): Promise<void> {
  const redis = getRedisClient()
  const key = `${SESSION_PREFIX}${sessionId}`

  // Preserve existing TTL
  const ttl = await redis.ttl(key)
  const remainingTtl = ttl > 0 ? ttl : SESSION_TTL_SECONDS

  await redis.set(key, JSON.stringify(data), 'EX', remainingTtl)
}

/**
 * Destroy a session (logout).
 */
export async function destroySession(sessionId: string): Promise<void> {
  const redis = getRedisClient()
  const key = `${SESSION_PREFIX}${sessionId}`
  await redis.del(key)
  console.log(`[BFF Session] Destroyed session ${sessionId}`)
}

/**
 * Get a valid access token for the given session.
 *
 * If the access token is expired, this function uses a Redis-based concurrency lock
 * to ensure only ONE request performs the refresh (Refresh Token Rotation).
 * All other concurrent requests wait and then use the newly refreshed token.
 *
 * This prevents the race condition described in the architecture doc:
 * - Multiple parallel requests see expired token
 * - All try to refresh simultaneously
 * - Only the first succeeds; others cause the IdP to force-logout
 */
export async function getValidAccessToken(sessionId: string): Promise<string | null> {
  const session = await getSession(sessionId)
  if (!session) return null

  // 1. Token still valid → use it directly
  if (Date.now() < session.expiresAt) {
    return session.accessToken
  }

  // 2. Token expired → start concurrency lock mechanism
  const redis = getRedisClient()
  const LOCK_KEY = `${LOCK_PREFIX}${session.userId}`
  const MAX_RETRIES = 15 // Max wait: 15 × 200ms = 3 seconds
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Try to acquire lock (SET NX EX — atomic, no race condition)
    // EX 10 → auto-release after 10s to prevent deadlock if server crashes
    const acquiredLock = await redis.set(LOCK_KEY, 'LOCKED', 'EX', 10, 'NX')

    if (acquiredLock === 'OK') {
      // ═══ EXCLUSIVE ZONE — Only 1 request enters here ═══
      try {
        // Double-check: maybe another request just refreshed the token
        const freshSession = await getSession(sessionId)
        if (freshSession && Date.now() < freshSession.expiresAt) {
          return freshSession.accessToken
        }

        if (!freshSession) return null

        // Call Golang backend to refresh token (RTR) with timeout from env (supports math expressions)
        const backendTimeout = parseEnvTime('BFF_BACKEND_TIMEOUT', 10000)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), backendTimeout)

        let response: Response
        try {
          response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: freshSession.refreshToken }),
            signal: controller.signal,
          })
        } catch (fetchError) {
          console.error('[BFF Session] Token refresh request failed/timed out:', fetchError)
          await destroySession(sessionId)
          return null
        } finally {
          clearTimeout(timeoutId)
        }

        if (!response.ok) {
          // Refresh failed — session is dead, destroy it
          console.error('[BFF Session] Token refresh failed, destroying session')
          await destroySession(sessionId)
          return null
        }

        const result = await response.json()
        const tokenData = result.data

        // Update session in Redis with new tokens
        const updatedSession: SessionData = {
          userId: freshSession.userId,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: tokenData.expires_at,
          user: tokenData.user || freshSession.user,
        }
        await updateSession(sessionId, updatedSession)

        console.log(`[BFF Session] Token refreshed for user ${freshSession.userId}`)
        return updatedSession.accessToken
      } finally {
        // ALWAYS release the lock (success or failure)
        await redis.del(LOCK_KEY)
      }
    } else {
      // ═══ WAITING ZONE — Lock held by another request ═══
      await sleep(200)

      // Check if the other request already refreshed the token
      const updatedSession = await getSession(sessionId)
      if (updatedSession && Date.now() < updatedSession.expiresAt) {
        return updatedSession.accessToken
      }
    }
  }

  // All retries exhausted
  console.error('[BFF Session] Timeout waiting for token refresh')
  return null
}
