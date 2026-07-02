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
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config