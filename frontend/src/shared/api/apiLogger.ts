/**
 * Frontend API Logger
 * Logs all API requests and responses in the browser console (development only)
 */

const isDev = import.meta.env.DEV

const COLORS = {
  request: 'color: #6366f1; font-weight: bold',   // indigo
  success: 'color: #22c55e; font-weight: bold',   // green
  error: 'color: #ef4444; font-weight: bold',      // red
  info: 'color: #94a3b8',                          // slate
  method: {
    GET: 'color: #3b82f6',
    POST: 'color: #f59e0b',
    PUT: 'color: #8b5cf6',
    PATCH: 'color: #14b8a6',
    DELETE: 'color: #ef4444',
  } as Record<string, string>,
}

export const apiLogger = {
  logRequest( method: string, url: string, body?: any ) {
    if ( !isDev ) return

    const methodColor = COLORS.method[method] || COLORS.info
    console.groupCollapsed(
      `%c→ ${method} %c${url}`,
      methodColor,
      COLORS.info
    )
    if ( body ) {
      try {
        const parsed = typeof body === 'string' ? JSON.parse( body ) : body
        console.log( '%cBody:', COLORS.info, parsed )
      } catch {
        console.log( '%cBody:', COLORS.info, body )
      }
    }
    console.log( '%cTime:', COLORS.info, new Date().toLocaleTimeString() )
    console.groupEnd()
  },

  logResponse( method: string, url: string, status: number, data: any, duration: number ) {
    if ( !isDev ) return

    const isOk = status >= 200 && status < 300
    const statusColor = isOk ? COLORS.success : COLORS.error
    const icon = isOk ? '✓' : '✗'

    console.groupCollapsed(
      `%c${icon} ${method} %c${url} %c${status} %c(${duration}ms)`,
      COLORS.method[method] || COLORS.info,
      COLORS.info,
      statusColor,
      COLORS.info
    )
    if ( data ) {
      console.log( '%cResponse:', COLORS.info, data )
    }
    console.groupEnd()
  },

  logError( method: string, url: string, error: Error, duration: number ) {
    if ( !isDev ) return

    console.groupCollapsed(
      `%c✗ ${method} %c${url} %cNETWORK ERROR %c(${duration}ms)`,
      COLORS.method[method] || COLORS.info,
      COLORS.info,
      COLORS.error,
      COLORS.info
    )
    console.error( error )
    console.groupEnd()
  },
}
