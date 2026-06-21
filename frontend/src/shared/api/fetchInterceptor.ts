// import { fromCrossJSON, createSerovalJSONPlugin } from 'seroval/plugins'

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

    // const method = (init?.method || 'GET').toUpperCase() as keyof typeof C.m
    // const label = decodeServerFnUrl(url)
    // const mc = C.m[method] || C.dim
    // const ts = formatTime(new Date())

    // console.groupCollapsed(
    //   `%c→ %c[${ts}] %c${method} %c${label}`,
    //   `color:${C.dim}`,
    //   `color:${C.dim}`,
    //   `color:${mc};font-weight:bold`,
    //   `color:${C.dim}`
    // )
    // // Log GET query params (only server function requests)
    // try {
    //   const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    //   if (urlObj.searchParams.size > 0) {
    //     const params = Object.fromEntries(urlObj.searchParams.entries())
    //     // Remove TanStack Start internal params
    //     delete params['tss-serverfn-split']
    //     if (Object.keys(params).length > 0) {
    //       console.log('%cParams:', `color:${C.dim};font-weight:bold`, params)
    //     }
    //   }
    // } catch {}

    // // Log request body / FormData / URLSearchParams
    // const bodyValue = init?.body
    // if (bodyValue) {
    //   try {
    //     if (bodyValue instanceof FormData) {
    //       const logged: Record<string, unknown> = {}
    //       for (const [key, value] of bodyValue.entries()) {
    //         logged[key] = value instanceof File ? `[File: ${value.name}]` : value
    //       }
    //       console.log('%cBody:', `color:${C.dim};font-weight:bold`, logged)
    //     } else if (bodyValue instanceof URLSearchParams) {
    //       console.log('%cBody:', `color:${C.dim};font-weight:bold`, Object.fromEntries(bodyValue.entries()))
    //     } else if (typeof bodyValue === 'string') {
    //       const parsed = JSON.parse(bodyValue)
    //       // Server function envelope: { t: { v: ..., m: ..., h: ... } }
    //       if (parsed?.t?.v != null) {
    //         console.log('%cPayload:', `color:${C.dim};font-weight:bold`, parsed.t.v)
    //       } else {
    //         console.log('%cBody:', `color:${C.dim};font-weight:bold`, parsed)
    //       }
    //     } else {
    //       // TypedArray, ArrayBuffer, Blob, ReadableStream — try stringifying
    //       const text = await bodyValue.text?.().catch(() => String(bodyValue)) ?? String(bodyValue)
    //       console.log('%cBody:', `color:${C.dim};font-weight:bold`, text)
    //     }
    //   } catch (e) {
    //     console.log('%cBody:', `color:${C.dim};font-weight:bold`, bodyValue)
    //   }
    // }
    // console.log(`%cTime: %c${new Date().toLocaleTimeString()}`, `color:${C.dim}`, 'color:#e2e8f0')
    // console.groupEnd()

    const start = performance.now()

    try {
      const response = await originalFetch.call(window, input, init)
      const duration = Math.round(performance.now() - start)
      const statusColor = response.ok ? C.ok : C.err
      // const icon = response.ok ? '✓' : '✗'
      const errorLabel = !response.ok ? ' ← ERROR' : ''

      const cloned = response.clone()
      // const rawText = await cloned.text().catch(() => '')

      let goResponse: any = null

      // if (rawText) {
      //   try {
      //     const parsed = JSON.parse(rawText)

      //     try {
      //       goResponse = fromCrossJSON(parsed, { plugins: [createSerovalJSONPlugin()] })
      //     } catch (e: any) {
      //       goResponse = null
      //     }
      //   } catch {
      //     goResponse = null
      //   }
      // }

      // console.groupCollapsed(
      //   `%c← %c[${ts}] %c${method} %c${label} %c${response.status} %c(${duration}ms)${errorLabel}`,
      //   `color:${C.dim}`,
      //   `color:${C.dim}`,
      //   `color:${mc};font-weight:bold`,
      //   `color:${C.dim}`,
      //   `color:${statusColor};font-weight:bold`,
      //   `color:${C.dim}`
      // )

      // if (goResponse !== null && goResponse !== undefined) {
      //   console.log('%cGo Response:', `color:${C.dim};font-weight:bold`, goResponse)
      // }

      // console.groupEnd()

      return response
    } catch (error) {
      // const duration = Math.round(performance.now() - start)
      // console.groupCollapsed(
      //   `%c✗ %c[${ts}] %c${method} %c${label} %cNETWORK ERROR %c(${duration}ms)`,
      //   `color:${C.dim}`,
      //   `color:${C.dim}`,
      //   `color:${mc};font-weight:bold`,
      //   `color:${C.dim}`,
      //   `color:${C.err};font-weight:bold`,
      //   `color:${C.dim}`
      // )
      // console.error(error)
      // console.groupEnd()
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
