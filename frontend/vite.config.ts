import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'path'

/**
 * Custom Vite Plugin for BFF Middleware
 * Intercepts /api/* requests and dispatches them to src/api-handlers handlers
 */
function bffMiddleware(): Plugin {
  return {
    name: 'bff-middleware',
    configureServer( server ) {
      server.middlewares.use( async ( req: any, res: any, next: any ) => {
        const url = req.url || ''
        const pathOnly = url.split( '?' )[0]

        if ( pathOnly.startsWith( '/api' ) ) {
          // Read body IMMEDIATELY before anything else can consume it
          let rawBody: string | undefined
          if ( req.method !== 'GET' && req.method !== 'HEAD' ) {
            rawBody = await new Promise<string | undefined>( ( resolve ) => {
              let data = ''
              req.on( 'data', ( chunk: Buffer ) => { data += chunk.toString() } )
              req.on( 'end', () => resolve( data || undefined ) )
              req.on( 'error', () => resolve( undefined ) )
            } )
          }

          try {
            const { dispatchBffRequest } = await server.ssrLoadModule( '/src/bff/dispatcher.ts' )
            const handled = await dispatchBffRequest( req, res, server.ssrLoadModule.bind( server ), rawBody )
            if ( handled ) return
          } catch ( e ) {
            console.error( '[BFF Plugin] Dispatch Error:', e )
          }
        }
        next()
      } )
    },
  }
}

export default defineConfig( {
  plugins: [
    bffMiddleware(),
    tanstackRouter(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve( __dirname, './src' ),
    },
  },
  server: {
    port: 3000,
  },
} ) // Touched to restart Vite dev server, load newly added api-handlers, and enable detailed dev errors
