/**
 * BFF Utilities - Helpers for API Routes
 * Following Professional/Enterprise standards for response consistency and session management.
 */

/**
 * Safe helper to get environment variables
 */
export function getEnv( key: string, defaultValue: string = '' ): string {
  // Try process.env first (Node.js)
  const val = ( globalThis as any ).process?.env?.[ key ]
  if ( val !== undefined ) return val

  // Try import.meta.env (Vite)
  // Note: import.meta.env is replaced at build time, so we check if it exists
  try {
    const metaVal = ( import.meta as any ).env?.[ key ]
    if ( metaVal !== undefined ) return metaVal
  } catch { }

  return defaultValue
}

/**
 * Safe helper to parse environment variables that might contain multiplication (e.g. "10 * 1000")
 */
export function parseEnvTime(key: string, defaultValue: number): number {
  const value = getEnv(key)
  if (!value) return defaultValue

  // Evaluate simple multiplication expressions like "7 * 24 * 60 * 60" or "30 * 60 * 1000"
  if (value.includes('*')) {
    try {
      const parts = value.split('*').map(p => p.trim())
      const nums = parts.map(p => parseFloat(p))
      if (nums.every(n => !isNaN(n))) {
        return nums.reduce((acc, curr) => acc * curr, 1)
      }
    } catch {
      // Fallback to simple parse if expression evaluation fails
    }
  }

  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

const BACKEND_URL = getEnv( 'BACKEND_URL', 'http://localhost:8080' )
const IS_DEV = getEnv( 'NODE_ENV' ) !== 'production'

/**
 * Standard BFF Response Format
 */
export interface BffResponse<T = any> {
  success: boolean
  status: number
  message: string
  data: T | null
  meta?: any
}

/**
 * BFF Logger for debugging API interactions (Active only in development)
 */
export const bffLogger = {
  logRequest: ( method: string, path: string, body?: any ) => {
    if ( !IS_DEV ) return
    const timestamp = new Date().toISOString()
    console.log( `\n🚀 [BFF Request] [${ timestamp }] ${ method } ${ path }` )
    if ( body ) {
      console.log( `   Body:`, body )
    }
  },
  logResponse: ( method: string, path: string, status: number, data: any ) => {
    if ( !IS_DEV ) return
    const timestamp = new Date().toISOString()
    const icon = status < 400 ? '✅' : '❌'
    console.log( `${ icon } [BFF Response] [${ timestamp }] ${ method } ${ path } - Status: ${ status }` )
    if ( data ) {
      console.log( `   Data:`, data )
    }
  },
  logError: ( method: string, path: string, error: any ) => {
    if ( !IS_DEV ) return
    const timestamp = new Date().toISOString()
    console.error( `❌ [BFF Error] [${ timestamp }] ${ method } ${ path }` )
    console.error( `   Error:`, error )
  }
}

/**
 * Helper to extract a cookie value from a Request
 */
export function getCookie( request: Request, name: string ): string | null {
  const cookieHeader = request.headers.get( 'Cookie' )
  if ( !cookieHeader ) return null
  const match = cookieHeader.match( new RegExp( `(?:^|; )${ name }=([^;]*)` ) )
  return match ? match[ 1 ] : null
}

/**
 * Helper to build a Web API Response object with optional cookies
 */
export class BffResponseBuilder {
  private headers = new Headers( { 'Content-Type': 'application/json' } )

  constructor( private status: number = 200 ) { }

  setCookie( name: string, value: string, maxAge: number = 86400 ) {
    this.headers.append(
      'Set-Cookie',
      `${ name }=${ value }; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ maxAge }`
    )
    return this
  }

  clearCookie( name: string ) {
    this.headers.append(
      'Set-Cookie',
      `${ name }=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    )
    return this
  }

  send<T>( success: boolean, message: string, data: T | null = null, meta?: any ) {
    return new Response(
      JSON.stringify( { success, message, data, meta } ),
      { status: this.status, headers: this.headers }
    )
  }

  static success<T>( message: string, data: T | null = null ) {
    return new BffResponseBuilder( 200 ).send( true, message, data )
  }

  static error( message: string, status: number = 400 ) {
    return new BffResponseBuilder( status ).send( false, message, null )
  }
}

/**
 * Helper to make requests from BFF to Go Backend.
 * Now uses Redis session: reads session_id cookie → looks up JWT from Redis → injects as Bearer token.
 * Automatic token refresh with concurrency lock is handled by getValidAccessToken().
 */
export async function makeBackendRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  incomingRequest?: Request
): Promise<BffResponse<T>> {
  const url = `${ BACKEND_URL }${ endpoint }`
  const method = ( options.method || 'GET' ).toUpperCase()

  let logBody = null
  if ( options.body && typeof options.body === 'string' ) {
    try { logBody = JSON.parse( options.body ) } catch { logBody = options.body }
  }

  bffLogger.logRequest( method, endpoint, logBody )

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...( options.headers as Record<string, string> || {} ),
  }

  // Resolve JWT from Redis session (with auto-refresh + concurrency lock)
  if ( incomingRequest ) {
    const sessionId = getCookie( incomingRequest, 'session_id' )
    if ( sessionId ) {
      // Dynamic import to avoid bundling Redis in client
      const { getValidAccessToken } = await import('./session')
      const accessToken = await getValidAccessToken( sessionId )
      if ( accessToken ) {
        headers[ 'Authorization' ] = `Bearer ${ accessToken }`
      }
    }
  }

  // Add timeout to backend requests from environment variable (supports math expressions)
  const backendTimeout = parseEnvTime('BFF_BACKEND_TIMEOUT', 10000)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), backendTimeout)

  try {
    const response = await fetch( url, { ...options, headers, signal: controller.signal } )
    clearTimeout(timeoutId)

    const contentType = response.headers.get('content-type') || ''
    let backendResponse: any = null
    let rawText: string = ''

    if (contentType.includes('application/json')) {
      backendResponse = await response.json().catch( () => null )
    } else {
      rawText = await response.text().catch( () => '' )
    }

    bffLogger.logResponse( method, endpoint, response.status, backendResponse || rawText )

    // Handle double-envelope: If backend followed the standard, unwrap it
    const success = response.ok && ( backendResponse?.success !== false )
    const data = ( backendResponse?.success !== undefined ) ? backendResponse.data : backendResponse

    let message = backendResponse?.message || ( response.ok ? 'Success' : 'Backend Error' )
    
    // In dev mode, if the request failed, enrich the message with full error details
    if (!response.ok && IS_DEV) {
      const details = rawText ? rawText : (backendResponse ? JSON.stringify(backendResponse) : response.statusText)
      bffLogger.logError(method, endpoint, `Backend URL ${url} returned ${response.status}: ${details}`)
    }

    return {
      status: response.status,
      success,
      message,
      data,
      meta: backendResponse?.meta || backendResponse?.pagination
    }
  } catch ( error: any ) {
    clearTimeout(timeoutId)
    bffLogger.logError( method, endpoint, error )
    
    // Distinguish timeout errors for better debugging/user messages
    const isTimeout = error.name === 'AbortError'
    return {
      status: isTimeout ? 504 : 500,
      success: false,
      message: isTimeout
        ? 'Backend request timed out (Backend is offline or unresponsive)'
        : `Network Error: ${error.message || error}`,
      data: null
    }
  }
}

/**
 * Raw backend request — returns the underlying Fetch Response so the BFF
 * handler can relay binary payloads (xlsx, pdf, octet-stream, images …)
 * to the browser without forcing a UTF-8 text decode.
 *
 * Authentication, timeout, and logging behaviour mirror `makeBackendRequest`.
 *
 * On network/timeout errors a synthetic `Response` is returned so callers
 * never have to deal with thrown exceptions — they can always inspect
 * `response.ok` / `response.status`.
 */
export async function makeBackendRequestRaw(
  endpoint: string,
  options: RequestInit = {},
  incomingRequest?: Request
): Promise<Response> {
  const url = `${ BACKEND_URL }${ endpoint }`
  const method = ( options.method || 'GET' ).toUpperCase()

  bffLogger.logRequest( method, endpoint, null )

  const headers: Record<string, string> = {
    ...( options.headers as Record<string, string> || {} ),
  }

  if ( incomingRequest ) {
    const sessionId = getCookie( incomingRequest, 'session_id' )
    if ( sessionId ) {
      const { getValidAccessToken } = await import('./session')
      const accessToken = await getValidAccessToken( sessionId )
      if ( accessToken ) {
        headers[ 'Authorization' ] = `Bearer ${ accessToken }`
      }
    }
  }

  const backendTimeout = parseEnvTime('BFF_BACKEND_TIMEOUT', 10000)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), backendTimeout)

  try {
    const response = await fetch( url, { ...options, headers, signal: controller.signal } )
    clearTimeout(timeoutId)
    bffLogger.logResponse( method, endpoint, response.status, '<binary>' )
    return response
  } catch ( error: any ) {
    clearTimeout(timeoutId)
    bffLogger.logError( method, endpoint, error )
    const isTimeout = error.name === 'AbortError'
    const body = JSON.stringify( {
      success: false,
      message: isTimeout
        ? 'Backend request timed out (Backend is offline or unresponsive)'
        : `Network Error: ${ error.message || error }`,
      data: null,
    } )
    return new Response( body, {
      status: isTimeout ? 504 : 500,
      headers: { 'Content-Type': 'application/json' },
    } )
  }
}

