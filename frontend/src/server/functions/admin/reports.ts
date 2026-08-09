import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { makeBackendRequest, makeBackendRequestRaw } from '../../backend'

export const getPermissionReportFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { query?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const url = data.query
      ? `/api/admin/reports/permission-report${data.query}`
      : '/api/admin/reports/permission-report'
    const result = await makeBackendRequest(url, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return { data: result.data, meta: result.meta }
  })

export const downloadPermissionReportFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { format: 'xlsx' | 'pdf'; query?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const url = data.query
      ? `/api/admin/reports/permission-report/download/${data.format}${data.query}`
      : `/api/admin/reports/permission-report/download/${data.format}`

    const response = await makeBackendRequestRaw(url, { method: 'GET' }, accessToken)
    if (!response.ok) throw new Error(`Download failed: ${response.status}`)

    const buffer = await response.arrayBuffer()
    return {
      buffer: Array.from(new Uint8Array(buffer)),
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      filename: response.headers.get('content-disposition') || '',
    }
  })
