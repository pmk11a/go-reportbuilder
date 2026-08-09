// User Reports Server Functions
// For executing and viewing reports

import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { makeBackendRequest, makeBackendRequestRaw } from '../../backend'

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
// EXPORT REPORT — TASK-027b AC6
// ============================================================

export interface ExportReportParams {
  kodeMenu: string
  format: 'xlsx' | 'pdf' | 'csv'
  filters?: Record<string, any>
  paperSize?: 'a4' | 'a3' | 'a5' | 'letter' | 'legal' | 'tabloid'
  orientation?: 'portrait' | 'landscape'
}

export const exportReportFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: ExportReportParams) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }

    const url = `/api/reports/${encodeURIComponent(data.kodeMenu)}/export/${data.format}`
    const response = await makeBackendRequestRaw(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: data.filters || {},
          paper_size: data.paperSize || 'a4',
          orientation: data.orientation || 'portrait',
        }),
      },
      accessToken
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || `Export failed: HTTP ${response.status}`)
    }

    // Convert raw Response body to base64 string (server fns only serialise JSON-safe data)
    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const disposition = response.headers.get('content-disposition') || ''
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i)
    const filename = filenameMatch ? filenameMatch[1] : `report.${data.format}`

    return {
      success: true,
      message: 'Export successful',
      data: {
        filename,
        contentType,
        base64: buffer.toString('base64'),
      },
    }
  })
