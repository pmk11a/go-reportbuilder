import { fromCrossJSON } from 'seroval'
import { getDefaultSerovalPlugins } from '@tanstack/react-start'

const isDev = typeof window !== 'undefined' && import.meta.env.DEV

const C = {
  m: { GET: '#3b82f6', POST: '#f59e0b', PUT: '#8b5cf6', PATCH: '#14b8a6', DELETE: '#ef4444' },
  ok: '#22c55e',
  err: '#ef4444',
  dim: '#94a3b8',
}

export function installFetchInterceptor() {
  if (!isDev || typeof window === 'undefined') return

  const originalFetch = window.fetch

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

    if (!url.includes('/_serverFn/')) {
      return originalFetch.call(window, input, init)
    }

    const method = (init?.method || 'GET').toUpperCase() as keyof typeof C.m
    const label = decodeServerFnUrl(url)
    const mc = C.m[method] || C.dim
    const ts = formatTime(new Date())

    console.groupCollapsed(
      `%c→ %c[${ts}] %c${method} %c${label}`,
      `color:${C.dim}`,
      `color:${C.dim}`,
      `color:${mc};font-weight:bold`,
      `color:${C.dim}`
    )
    if (init?.body) {
      try {
        const parsed = JSON.parse(init.body as string)
        if (parsed?.t?.v) {
          console.log('%cPayload:', `color:${C.dim};font-weight:bold`, parsed.t.v)
        }
      } catch {}
    }
    console.log(`%cTime: %c${new Date().toLocaleTimeString()}`, `color:${C.dim}`, 'color:#e2e8f0')
    console.groupEnd()

    const start = performance.now()

    try {
      const response = await originalFetch.call(window, input, init)
      const duration = Math.round(performance.now() - start)
      const statusColor = response.ok ? C.ok : C.err
      const icon = response.ok ? '✓' : '✗'
      const errorLabel = !response.ok ? ' ← ERROR' : ''

      const cloned = response.clone()
      const rawText = await cloned.text().catch(() => '')

      let goResponse: any = null

      if (rawText) {
        try {
          const parsed = JSON.parse(rawText)

          try {
            goResponse = fromCrossJSON(parsed, { plugins: getDefaultSerovalPlugins() })
          } catch (e: any) {
            goResponse = null
          }
        } catch {
          goResponse = null
        }
      }

      console.groupCollapsed(
        `%c← %c[${ts}] %c${method} %c${label} %c${response.status} %c(${duration}ms)${errorLabel}`,
        `color:${C.dim}`,
        `color:${C.dim}`,
        `color:${mc};font-weight:bold`,
        `color:${C.dim}`,
        `color:${statusColor};font-weight:bold`,
        `color:${C.dim}`
      )

      if (goResponse !== null && goResponse !== undefined) {
        console.log('%cGo Response:', `color:${C.dim};font-weight:bold`, goResponse)
      }

      console.groupEnd()

      return response
    } catch (error) {
      const duration = Math.round(performance.now() - start)
      console.groupCollapsed(
        `%c✗ %c[${ts}] %c${method} %c${label} %cNETWORK ERROR %c(${duration}ms)`,
        `color:${C.dim}`,
        `color:${C.dim}`,
        `color:${mc};font-weight:bold`,
        `color:${C.dim}`,
        `color:${C.err};font-weight:bold`,
        `color:${C.dim}`
      )
      console.error(error)
      console.groupEnd()
      throw error
    }
  }
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function decodeServerFnUrl(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin)
    const segments = urlObj.pathname.split('/_serverFn/')
    if (segments.length < 2) return url

    let encoded = segments[1].replace(/-/g, '+').replace(/_/g, '/')
    while (encoded.length % 4 !== 0) encoded += '='

    const decoded = atob(encoded)
    const json = JSON.parse(decoded)

    if (json.file) {
      const shortPath = json.file.replace(/^.*\/server\/functions\//, '').replace(/\.ts$/, '')
      return json.fn ? `${shortPath} → ${json.fn}` : shortPath
    }
  } catch {}

  return `serverFn`
}
