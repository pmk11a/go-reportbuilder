import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../middleware/auth'
import { makeBackendRequest, makeBackendRequestRaw } from '../backend'

interface ProxyInput {
  endpoint: string
  method?: string
  body?: any
  query?: string
}

export const proxyFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: ProxyInput) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const { endpoint, method = 'GET', body, query } = data

    const url = query ? `${endpoint}${query}` : endpoint

    const result = await makeBackendRequest(url, {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
    }, accessToken)

    if (!result.success) {
      throw new Error(result.message || 'Request failed')
    }

    return { data: result.data, meta: result.meta }
  })

export const proxyGetFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { endpoint: string; query?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const url = data.query ? `${data.endpoint}${data.query}` : data.endpoint

    const result = await makeBackendRequest(url, { method: 'GET' }, accessToken)

    if (!result.success) {
      throw new Error(result.message || 'Request failed')
    }

    return { data: result.data, meta: result.meta }
  })

export const proxyRawFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { endpoint: string; method?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }

    const response = await makeBackendRequestRaw(data.endpoint, {
      method: data.method || 'GET',
    }, accessToken)

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`)
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    return {
      buffer: Array.from(new Uint8Array(buffer)),
      contentType,
      filename: response.headers.get('content-disposition') || '',
    }
  })
