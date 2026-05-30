import React from 'react'
import ReactDOM from 'react-dom/client'
import './lib/i18n'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { queryClient } from './lib/query-client'
import { routeTree } from './routeTree.gen'
import 'nprogress/nprogress.css'

// Create router instance
const router = createRouter({ 
  routeTree,
  context: {
    auth: undefined!, // We'll inject this in the provider if needed, or use store directly
  },
})

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')

if (!rootElement?.innerHTML) {
  const root = ReactDOM.createRoot(rootElement!)
  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </HelmetProvider>
    </React.StrictMode>
  )
}
