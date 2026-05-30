import { useAuthStore } from '@/store/authStore'
import { formatAPIError } from '@/utils/errorMapper'
import { apiLogger } from '@/lib/apiLogger'
import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false, minimum: 0.2 });

let activeRequests = 0;

function startProgress() {
  activeRequests++;
  if (activeRequests === 1) NProgress.start();
}

function stopProgress() {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) NProgress.done();
}

/**
 * Safe helper to get environment variables
 */
function getEnv( key: string, defaultValue: string = '' ): string {
  const val = ( globalThis as any ).process?.env?.[ key ]
  if ( val !== undefined ) return val

  try {
    const metaVal = ( import.meta as any ).env?.[ key ]
    if ( metaVal !== undefined ) return metaVal
  } catch { }

  return defaultValue
}

/**
 * Safe helper to parse environment variables that might contain multiplication (e.g. "10 * 1000")
 */
function parseEnvTime(key: string, defaultValue: number): number {
  const value = getEnv(key)
  if (!value) return defaultValue

  if (value.includes('*')) {
    try {
      const parts = value.split('*').map(p => p.trim())
      const nums = parts.map(p => parseFloat(p))
      if (nums.every(n => !isNaN(n))) {
        return nums.reduce((acc, curr) => acc * curr, 1)
      }
    } catch {
      // Fallback
    }
  }

  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

const API_BASE = getEnv('VITE_API_URL', '/api')
const CLIENT_TIMEOUT = parseEnvTime('VITE_CLIENT_TIMEOUT', 15000)

export class APIError extends Error {
  public rawMsg: string;

  constructor(
    public status: number,
    public data: any,
    public code?: string
  ) {
    super(); // Call super first
    Object.setPrototypeOf(this, APIError.prototype); // Fix instanceof

    const rawMsg = data?.message || data?.data?.error || data?.error || '';
    this.name = 'APIError';
    this.rawMsg = rawMsg;
    this.code = data?.error || data?.data?.error || `HTTP_${status}`;

    // Define message as a dynamic getter on the instance to avoid shadowing issues
    Object.defineProperty(this, 'message', {
      get: () => formatAPIError(this.status, this.rawMsg),
      enumerable: true,
      configurable: true
    });
  }

  isUnauthorized(): boolean { return this.status === 401 }
  isForbidden(): boolean { return this.status === 403 }
  isNotFound(): boolean { return this.status === 404 }
  isValidationError(): boolean { return this.status === 400 }
  isServerError(): boolean { return this.status >= 500 }
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, any>
  skipAuth?: boolean
}

// ─── CSRF Token Management ───
// The CSRF token is fetched once from the BFF and reused for all requests.
// When it expires (30min), the BFF returns 403 and we auto-refresh it.
let csrfToken: string | null = null
let csrfFetchPromise: Promise<string | null> | null = null

/**
 * Fetch CSRF token from BFF server.
 * This is the "key" that proves the request comes from our frontend JS.
 * Without it, direct URL access to /api/* returns 403.
 */
async function fetchCsrfToken(): Promise<string | null> {
  // Deduplicate concurrent calls
  if (csrfFetchPromise) return csrfFetchPromise

  csrfFetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) return null

      const result = await response.json()
      csrfToken = result?.data?.token || null
      return csrfToken
    } catch {
      return null
    } finally {
      csrfFetchPromise = null
    }
  })()

  return csrfFetchPromise
}

/**
 * Get the current CSRF token, fetching it if needed.
 */
async function getCsrfToken(): Promise<string | null> {
  if (csrfToken) return csrfToken
  return fetchCsrfToken()
}

// ─── Token Refresh Management ───
let tokenRefreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (tokenRefreshPromise) return tokenRefreshPromise

  tokenRefreshPromise = (async () => {
    try {
      const token = await getCsrfToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) headers['X-CSRF-Token'] = token

      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers,
      })

      if (!response.ok) {
        useAuthStore.getState().logout()
        return false
      }
      return true
    } catch (error) {
      useAuthStore.getState().logout()
      return false
    } finally {
      tokenRefreshPromise = null
    }
  })()

  return tokenRefreshPromise
}

/**
 * Core fetch helper for the application.
 * Handles base URL, search params, common headers, CSRF token injection,
 * logging, and automatic token refresh on 401.
 *
 * Every request to /api/* automatically includes the X-CSRF-Token header,
 * which proves the request originates from our frontend JavaScript.
 * Without this header, the BFF dispatcher returns 403.
 */
export async function fetchHelper<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  // Check for offline status before attempting fetch
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new APIError(0, { message: 'You are currently offline. Request cannot be completed.' }, 'OFFLINE_ERROR')
  }

  const fullPath = `${API_BASE}${endpoint}`
  const url = new URL(fullPath, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  // Inject CSRF token into every request
  const token = await getCsrfToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'X-CSRF-Token': token } : {}),
    ...(options.headers as Record<string, string>),
  }

  // Add timeout to client requests from environment variable
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT)

  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers,
    signal: controller.signal,
  }

  const method = (options.method || 'GET').toUpperCase()
  apiLogger.logRequest(method, endpoint, options.body)
  const startTime = performance.now()
  startProgress()

  let response: Response
  let data: any = null

  try {
    response = await fetch(url.toString(), fetchOptions)
    clearTimeout(timeoutId)
    data = await response.json().catch(() => null)
  } catch (error: any) {
    clearTimeout(timeoutId)
    const isTimeout = error.name === 'AbortError'
    apiLogger.logResponse(method, endpoint, isTimeout ? 504 : 500, null, Math.round(performance.now() - startTime))
    stopProgress()
    throw new APIError(isTimeout ? 504 : 500, {
      message: isTimeout 
        ? 'Request timed out. Please check if the server is running.' 
        : error.message || 'Network Connection Error'
    })
  }
  const duration = Math.round(performance.now() - startTime)

  // If CSRF token expired, auto-refresh and retry
  if (response.status === 403 && data?.message?.includes('Access denied')) {
    csrfToken = null // Clear stale token
    const newToken = await fetchCsrfToken()
    if (newToken) {
      const retryController = new AbortController()
      const retryTimeoutId = setTimeout(() => retryController.abort(), CLIENT_TIMEOUT)
      
      try {
        (fetchOptions.headers as Record<string, string>)['X-CSRF-Token'] = newToken
        fetchOptions.signal = retryController.signal
        response = await fetch(url.toString(), fetchOptions)
        clearTimeout(retryTimeoutId)
        data = await response.json().catch(() => null)
      } catch (retryError: any) {
        clearTimeout(retryTimeoutId)
        const isTimeout = retryError.name === 'AbortError'
        stopProgress()
        throw new APIError(isTimeout ? 504 : 500, {
          message: isTimeout ? 'Request timed out during retry.' : retryError.message || 'Network Error'
        })
      }
    }
  }

  // If 401, attempt session refresh
  if (response.status === 401 && !options.skipAuth) {
    const success = await refreshAccessToken()
    if (success) {
      response = await fetch(url.toString(), fetchOptions)
      data = await response.json().catch(() => null)
    }
  }

  if (!response.ok) {
    apiLogger.logResponse(method, endpoint, response.status, data, duration)
    stopProgress()
    throw new APIError(response.status, data)
  }

  apiLogger.logResponse(method, endpoint, response.status, data, duration)
  stopProgress()
  return data
}

/**
 * Initialize CSRF protection.
 * Call this once on app startup to pre-fetch the CSRF token.
 */
export async function initCsrfProtection(): Promise<void> {
  await getCsrfToken()
}
