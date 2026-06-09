import { createMiddleware } from '@tanstack/react-start'
import { csrfMiddleware } from './csrf'
import { rateLimitMiddleware } from './rate-limit'
import { sessionMiddleware } from './session'

export const authMiddleware = createMiddleware({ type: 'request' })
  .middleware([rateLimitMiddleware, csrfMiddleware, sessionMiddleware])
  .server(async ({ next, context }) => {
    return next({ context })
  })
