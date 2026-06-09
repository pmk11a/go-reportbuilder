import { createStart } from '@tanstack/react-start'
import { rateLimitMiddleware } from './server/middleware'

export default createStart(() => ({
  requestMiddleware: [rateLimitMiddleware],
}))
