import { getEnv } from './utils'
import { validateCsrfToken, isCsrfExempt, validateClientRequest } from './csrf'
import { checkRateLimit } from './rate-limit'

/**
 * BFF Dispatcher for Vite (Development)
 * This mimics TanStack Start's API routing by loading handlers from src/api-handlers.
 *
 * Security: All /api/* routes are protected by CSRF validation.
 * Requests without a valid X-CSRF-Token header are rejected with 403.
 */
export async function dispatchBffRequest( req: any, res: any, ssrLoadModule: any, rawBody?: string ) {
  const url = new URL( req.url, 'http://localhost' )
  const pathname = url.pathname // e.g., /api/auth/login

  if ( !pathname.startsWith( '/api/' ) ) return false

  // ─── GATE 1: Block direct browser URL bar navigation for ALL /api/* routes ───
  if ( !validateClientRequest( req.headers ) ) {
    console.warn( `[BFF Security] Blocked direct browser navigation to ${ req.method } ${ pathname }` )
    res.statusCode = 403
    res.setHeader( 'Content-Type', 'application/json' )
    res.end( JSON.stringify( {
      success: false,
      message: 'Access denied. Direct access via browser URL bar is prohibited.',
    } ) )
    return true
  }

  // ─── GATE 2: CSRF Validation (exempts /api/csrf-token bootstrap) ───
  if ( !isCsrfExempt( pathname ) ) {
    const csrfToken = req.headers[ 'x-csrf-token' ]

    if ( !validateCsrfToken( csrfToken ) ) {
      console.warn( `[BFF Security] CSRF validation failed for ${ req.method } ${ pathname }` )
      res.statusCode = 403
      res.setHeader( 'Content-Type', 'application/json' )
      res.end( JSON.stringify( {
        success: false,
        message: 'Access denied. This API can only be accessed from the application.',
      } ) )
      return true
    }
  }
  // ─── GATE 3: Rate Limiting ───
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1'
  const rateLimit = await checkRateLimit(clientIp)
  if (!rateLimit.allowed) {
    console.warn(`[BFF Security] Rate limit exceeded for IP: ${clientIp}`)
    res.statusCode = 429
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Retry-After', '60')
    res.end(JSON.stringify({
      success: false,
      message: 'Terlalu banyak permintaan. Silakan coba lagi nanti (Rate Limit 429).',
    }))
    return true
  }
  // ─── END SECURITY GATES ───

  try {
    // Convert /api/auth/login to ./api-handlers/auth/login.ts
    // We strip the leading /api/ from pathname (which is e.g. /api/auth/login)
    const handlerPath = pathname.substring( 4 ) // "/auth/login"

    // Try flat file first: /src/api-handlers/auth/login.ts
    let modulePath = `/src/api-handlers${ handlerPath }.ts`
    let mod = null

    try {
      mod = await ssrLoadModule( modulePath )
    } catch {
      // Fallback: try index file in directory: /src/api-handlers/auth/login/index.ts
      modulePath = `/src/api-handlers${ handlerPath }/index.ts`
      try {
        mod = await ssrLoadModule( modulePath )
      } catch {
        // Both paths failed, will be handled below
      }
    }

    // Load the "API Route" module
    // mod is now either loaded or null

    if ( mod && mod.APIRoute ) {
      const handler = mod.APIRoute[ req.method ]
      if ( handler ) {
        console.log( `[BFF] Dispatching ${ req.method } ${ pathname }` )

        // Sanitize Node.js headers (can contain undefined or array values)
        const cleanHeaders: Record<string, string> = {}
        for ( const [key, value] of Object.entries( req.headers ) ) {
          if ( value !== undefined ) {
            cleanHeaders[key] = Array.isArray( value ) ? value.join( ', ' ) : String( value )
          }
        }

        // Build a Web API Request for the handler
        const requestInit: any = {
          method: req.method,
          headers: cleanHeaders,
        }
        if ( rawBody ) {
          requestInit.body = rawBody
          requestInit.duplex = 'half'
        }
        const request = new Request( `http://localhost${ req.url }`, requestInit )

        // Attach raw body for direct access (Node.js Request.json() workaround)
        ;( request as any )._body = rawBody

        try {
          const response = await handler( { request } )

          // Forward the response back to the client
          res.statusCode = response.status
          response.headers.forEach( ( value: string, key: string ) => {
            res.setHeader( key, value )
          } )

          // Stream binary payloads (xlsx, pdf, octet-stream, images, etc.)
          // unchanged — only text/json responses go through .text() so that
          // string-based responses keep working without buffering issues.
          const contentType = ( response.headers.get( 'content-type' ) || '' ).toLowerCase()
          const isBinary =
            !contentType.startsWith( 'text/' ) &&
            !contentType.includes( 'json' ) &&
            !contentType.includes( 'xml' ) &&
            !contentType.includes( 'html' ) &&
            contentType !== ''

          if ( isBinary ) {
            const buf = Buffer.from( await response.arrayBuffer() )
            res.end( buf )
          } else {
            const body = await response.text()
            res.end( body )
          }
          return true
        } catch ( handlerError: any ) {
          console.error( `[BFF] Handler Error for ${ pathname }:`, handlerError )
          res.statusCode = 500
          res.setHeader( 'Content-Type', 'application/json' )
          res.end( JSON.stringify( { 
            success: false, 
            message: 'Internal BFF Error', 
            error: getEnv('NODE_ENV') === 'development' ? handlerError.message : 'An unexpected error occurred' 
          } ) )
          return true
        }
      } else {
        console.log( `[BFF] Handler for method ${ req.method } not found in ${ pathname }` )
      }
    } else {
      console.log( `[BFF] APIRoute export not found in ${ modulePath }` )
    }
  } catch ( e: any ) {
    console.error( `[BFF Dispatcher] Error loading or executing ${ pathname }:`, e )
  }

  console.log( `[BFF] Falling back to next() for ${ pathname }` )
  return false
}
