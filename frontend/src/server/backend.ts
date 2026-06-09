const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'
const BACKEND_TIMEOUT = parseInt(process.env.BFF_BACKEND_TIMEOUT || '10000', 10)
const IS_DEV = process.env.NODE_ENV !== 'production'

export interface BackendResponse<T = any> {
  success: boolean
  status: number
  message: string
  data: T | null
  meta?: any
}

export async function makeBackendRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<BackendResponse<T>> {
  const url = `${BACKEND_URL}${endpoint}`
  const method = (options.method || 'GET').toUpperCase()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT)

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal })
    clearTimeout(timeoutId)

    const contentType = response.headers.get('content-type') || ''
    let backendResponse: any = null

    if (contentType.includes('application/json')) {
      backendResponse = await response.json().catch(() => null)
    }

    if (IS_DEV) {
      console.log(`[Server] ${method} ${endpoint} → ${response.status}`)
    }

    const success = response.ok && (backendResponse?.success !== false)
    const data = (backendResponse?.success !== undefined) ? backendResponse.data : backendResponse

    return {
      status: response.status,
      success,
      message: backendResponse?.message || (response.ok ? 'Success' : 'Backend Error'),
      data,
      meta: backendResponse?.meta || backendResponse?.pagination,
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    const isTimeout = error.name === 'AbortError'
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

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT)

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal })
    clearTimeout(timeoutId)

    if (IS_DEV) {
      console.log(`[Server] ${method} ${endpoint} (raw) → ${response.status}`)
    }

    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    const isTimeout = error.name === 'AbortError'
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
