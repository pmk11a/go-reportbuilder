import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/cypress/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/domains': path.resolve(__dirname, './src/domains'),
      '@/server': path.resolve(__dirname, './src/server'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/schemas': path.resolve(__dirname, './src/schemas'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/locales': path.resolve(__dirname, './src/locales'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/providers': path.resolve(__dirname, './src/providers'),
      '@/test': path.resolve(__dirname, './src/test'),
    },
  },
})
