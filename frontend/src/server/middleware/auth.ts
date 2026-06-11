import { createMiddleware } from '@tanstack/react-start'
import { rateLimitMiddleware } from './rate-limit'
import { sessionMiddleware } from './session'

export const authMiddleware = createMiddleware({ type: 'request' })
  .middleware([rateLimitMiddleware, sessionMiddleware])
  .server(async ({ next, context }) => {
    return next({ context })
  })
