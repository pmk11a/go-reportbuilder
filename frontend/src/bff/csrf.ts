/**
 * BFF CSRF Protection — HMAC-based Double Submit Cookie Pattern
 *
 * This module protects ALL BFF API routes from direct access.
 * Only requests originating from our frontend JavaScript can access /api/* endpoints.
 *
 * How it works:
 * 1. Client calls GET /api/csrf-token on app initialization
 * 2. BFF generates an HMAC-signed token using a server-side secret
 * 3. Token is returned in response body AND set as a readable cookie (csrf_token)
 * 4. Client sends the token as X-CSRF-Token header on every subsequent request
 * 5. BFF dispatcher validates: header present + HMAC signature valid + not expired
 *
 * Why this blocks direct access:
 * - URL bar: Browser doesn't send custom headers → blocked
 * - curl/Postman: They don't have the HMAC secret to forge tokens → blocked
 * - XSS: Even if attacker gets the cookie, SameSite=Strict prevents cross-origin use
 *
 * WARNING: This file is server-side only. Never import in client code.
 */
import { createHmac } from 'crypto'
import { getEnv, parseEnvTime } from './utils'

// Server-side secret — NEVER exposed to browser
const BFF_SECRET = getEnv('BFF_INTERNAL_SECRET', 'dapen-bff-internal-secret-change-in-production')

// Token validity duration (from env, defaults to 30 minutes, supports math expressions)
const TOKEN_TTL_MS = parseEnvTime('CSRF_TOKEN_TTL_MS', 1800000)

/**
 * Generate a CSRF token signed with HMAC.
 * Format: {timestamp}.{hmac_signature}
 */
export function generateCsrfToken(): string {
  const timestamp = Date.now().toString()
  const signature = createHmac('sha256', BFF_SECRET)
    .update(timestamp)
    .digest('hex')

  return `${timestamp}.${signature}`
}

/**
 * Validate a CSRF token.
 * Checks: format, HMAC signature, and expiration.
 */
export function validateCsrfToken(token: string | null | undefined): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [timestamp, signature] = parts
  const ts = parseInt(timestamp, 10)

  // Check if timestamp is valid
  if (isNaN(ts)) return false

  // Check if token is expired
  if (Date.now() - ts > TOKEN_TTL_MS) return false

  // Verify HMAC signature (timing-safe comparison via recalculation)
  const expectedSignature = createHmac('sha256', BFF_SECRET)
    .update(timestamp)
    .digest('hex')

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return false

  let mismatch = 0
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i)
  }

  return mismatch === 0
}

/**
 * Routes that are exempt from CSRF validation.
 * The csrf-token endpoint itself must be accessible to bootstrap the system.
 */
const CSRF_EXEMPT_ROUTES = [
  '/api/csrf-token',
]

/**
 * Check if a route is exempt from CSRF validation.
 */
export function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_ROUTES.some(route => pathname === route)
}

/**
 * Verifies that the request comes from our client app (JS fetch/XHR) 
 * and not from direct browser URL navigation (typing in address bar, bookmarks, etc.).
 * 
 * Uses standard browser Sec-Fetch metadata headers.
 */
export function validateClientRequest(headers: Record<string, any>): boolean {
  const mode = headers['sec-fetch-mode'] || ''
  const dest = headers['sec-fetch-dest'] || ''
  const accept = headers['accept'] || ''

  // 1. Block direct browser navigation (mode: navigate, dest: document/iframe)
  if (mode === 'navigate' || dest === 'document' || dest === 'iframe') {
    return false
  }

  // 2. Block requests expecting HTML (standard browser page requests)
  if (accept.includes('text/html')) {
    return false
  }

  return true
}

