import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const config = defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#tanstack-router-entry': path.resolve(__dirname, './src/router.tsx'),
      '#tanstack-start-entry': path.resolve(__dirname, './src/start.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@tanstack/start-server-core'],
  },
  plugins: [
    // Enhanced logs (the @tanstack/devtools source-injector) rewrite
    // `console.log`/`console.error` arguments with extra strings that include
    // a `Go to Source: http://localhost:PORT/__tsd/open-source?source=...`
    // link. Clicking the link opens a separate `fetch(/__tsd/open-source)`
    // round-trip that fails in the SSR sandbox with
    //   "[Server] LOG ... → Error: fetch failed"
    // because the SSR bundle has no network access to the user's browser
    // localhost. Disable the source injection since we already have working
    // source maps via TanStack Start's default error reporter.
    devtools({ injectSource: { enabled: false } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config