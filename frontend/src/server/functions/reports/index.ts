// User Reports Server Functions
// For executing and viewing reports

import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { makeBackendRequest } from '../../backend'

// ============================================================
// SIDEBAR MENU
// ============================================================

export const getReportsMenuFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { q?: string } | undefined) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    
    let url = '/api/reports/menu'
    if (data?.q) {
      url += `?q=${encodeURIComponent(data.q)}`
    }
    
    const result = await makeBackendRequest(url, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

// ============================================================
// REPORT CONFIG
// ============================================================

export const getReportConfigFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { kodeMenu: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/reports/${encodeURIComponent(data.kodeMenu)}`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

// ============================================================
// EXECUTE REPORT
// ============================================================

export interface ExecuteReportParams {
  kodeMenu: string
  filters: Record<string, string | string[] | null>
}

export const executeReportFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: ExecuteReportParams) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }

    // Build query string from filters
    const queryParams = new URLSearchParams()
    for (const [key, value] of Object.entries(data.filters)) {
      if (value === null || value === undefined || value === '') continue
      if (Array.isArray(value)) {
        for (const v of value) {
          queryParams.append(key, v)
        }
      } else {
        queryParams.append(key, String(value))
      }
    }

    const queryString = queryParams.toString()
    const url = queryString
      ? `/api/reports/${encodeURIComponent(data.kodeMenu)}/preview?${queryString}`
      : `/api/reports/${encodeURIComponent(data.kodeMenu)}/preview`

    const result = await makeBackendRequest(url, { method: 'POST' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

// ============================================================
// EXPORT (Future)
// ============================================================

// export const exportReportFn = createServerFn({ method: 'POST' })
//   .middleware([authMiddleware])
//   .validator((data: { kodeMenu: string; format: 'xlsx' | 'pdf'; filters: Record<string, any> }) => data)
//   .handler(async ({ data, context }) => {
//     const { accessToken } = context as { accessToken: string }
//     // Will call /api/reports/:kodeMenu/export/:format
//   })
