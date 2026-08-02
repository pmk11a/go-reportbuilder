import { getEnv, parseEnvTime } from './utils'

const BACKEND_URL = getEnv('BACKEND_URL', 'http://127.0.0.1:8080')
const BACKEND_TIMEOUT = parseEnvTime('BFF_BACKEND_TIMEOUT', 60000)
const IS_DEV = process.env.NODE_ENV !== 'production'

export interface BackendResponse<T = any> {
  success: boolean
  status: number
  message: string
  data: T | null
  meta?: any
}

const serverLogger = {
  logRequest(method: string, path: string, body?: any) {
    if (!IS_DEV) return
    const ts = new Date().toISOString().slice(11, 23)
    console.groupCollapsed(`\n→ [${ts}] ${method} ${path}`)
    
    if (body) {
      try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body
        console.log(`  Body:`, parsed)
      } catch {
        console.log(`  Body:`, body)
      }
    }
    
    // log query params if present in the path
    const url = new URL(path, getEnv('VITE_APP_URL', 'http://localhost:3000'))
    const queryParams = Object.fromEntries(url.searchParams.entries())
    if (Object.keys(queryParams).length > 0) {
      console.log(`  Query Params:`, queryParams)
    }
    
    console.groupEnd()
  },
  logResponse(method: string, path: string, status: number, data: any, duration: number) {
    if (!IS_DEV) return
    const ts = new Date().toISOString().slice(11, 23)
    const ok = status < 400
    
    console.groupCollapsed(`\n← [${ts}] ${method} ${path} ${status} (${duration}ms)${ok ? '' : ' ← ERROR'}`)
    
    if (data !== null && data !== undefined) {
      console.log(`  Data:`, data)
    }
    
    console.groupEnd()
  },
  logError(method: string, path: string, error: any, duration: number) {
    if (!IS_DEV) return
    const ts = new Date().toISOString().slice(11, 23)
    // console.error(`✗ [${ts}] ${method} ${path} (${duration}ms)`)
    // console.error(`  Error:`, error?.message || error)
    console.groupCollapsed(`\n✗ [${ts}] ${method} ${path} (${duration}ms) ← ERROR`)
    console.error(`  Error:`, error?.message || error)
    console.groupEnd()
  },
}

export async function makeBackendRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<BackendResponse<T>> {
  const url = `${BACKEND_URL}${endpoint}`
  const method = (options.method || 'GET').toUpperCase()

  serverLogger.logRequest(method, endpoint, options.body)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT)
  const startTime = Date.now()

  try {
    const response = await fetch(url, {
      method,
      body: options.body,
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const duration = Date.now() - startTime

    const contentType = response.headers.get('content-type') || ''
    let backendResponse: any = null
    let rawText: string = ''

    if (contentType.includes('application/json')) {
      backendResponse = await response.json().catch(() => null)
    } else {
      rawText = await response.text().catch(() => '')
    }

    serverLogger.logResponse(method, endpoint, response.status, backendResponse || rawText, duration)

    const success = response.ok && (backendResponse?.success !== false)
    const data = (backendResponse?.success !== undefined) ? backendResponse.data : backendResponse

    const message = backendResponse?.message || (response.ok ? 'Success' : 'Backend Error')

    return {
      status: response.status,
      success,
      message,
      data,
      meta: backendResponse?.meta || backendResponse?.pagination,
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    const duration = Date.now() - startTime
    const isTimeout = error.name === 'AbortError'

    serverLogger.logError(method, endpoint, error, duration)

    return {
      status: isTimeout ? 504 : 500,
      success: false,
      message: isTimeout
        ? 'Backend request timed out'
        : `Network Error: ${error.message || error}`,
      data: null,
    }
  }
}

export async function makeBackendRequestRaw(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<Response> {
  const url = `${BACKEND_URL}${endpoint}`
  const method = (options.method || 'GET').toUpperCase()

  serverLogger.logRequest(method, endpoint, null)

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT)
  const startTime = Date.now()

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal })
    clearTimeout(timeoutId)
    const duration = Date.now() - startTime

    serverLogger.logResponse(method, endpoint, response.status, '<binary>', duration)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    const duration = Date.now() - startTime
    const isTimeout = error.name === 'AbortError'

    serverLogger.logError(method, endpoint, error, duration)

    return new Response(
      JSON.stringify({
        success: false,
        message: isTimeout ? 'Backend request timed out' : `Network Error: ${error.message}`,
        data: null,
      }),
      { status: isTimeout ? 504 : 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
