import { createServerFn } from '@tanstack/react-start'
import { generateCsrfToken } from '../middleware/csrf'

export const getCsrfTokenFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const token = generateCsrfToken()
    return { token }
  })
