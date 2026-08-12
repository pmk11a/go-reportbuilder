// Admin Reports Server Functions
// CRUD operations for report management

import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../../middleware/auth'
import { makeBackendRequest, makeBackendRequestRaw } from '../../../backend'

// ============================================================
// REPORTS
// ============================================================

export const listReportsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data?: { page?: number; limit?: number; search?: string }) => data || {})
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    
    const query = new URLSearchParams()
    if (data.page) query.append('page', data.page.toString())
    if (data.limit) query.append('limit', data.limit.toString())
    if (data.search) query.append('search', data.search)
    const queryString = query.toString() ? `?${query.toString()}` : ''

    const result = await makeBackendRequest(`/api/admin/reports${queryString}`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const getReportFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const createReportFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: {
    KODEMENU: string
    nama_laporan: string
    deskripsi?: string
    status_aktif?: boolean
    footer_bands?: any
  }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/admin/reports', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const updateReportFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; payload: Record<string, any> }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data.payload),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const deleteReportFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}`, { method: 'DELETE' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const getAvailableKodeMenuFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/admin/reports/available-kodemenu', { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

// ============================================================
// FILTERS
// ============================================================

export const getFiltersFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/filters`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

// ============================================================================
// KOMPONEN (LAYOUT)
// ============================================================================

export const getKomponenFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/komponen`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const upsertKomponenFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; payload: Record<string, any> }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/komponen`, {
      method: 'PUT',
      body: JSON.stringify(data.payload),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const createFilterFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; payload: Record<string, any> }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/filters`, {
      method: 'POST',
      body: JSON.stringify(data.payload),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const updateFilterFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; filterId: number; payload: Record<string, any> }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/filters/${data.filterId}`, {
      method: 'PUT',
      body: JSON.stringify(data.payload),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const deleteFilterFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; filterId: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/filters/${data.filterId}`, { method: 'DELETE' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

// ============================================================
// DATASETS
// ============================================================

export const getDatasetsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/datasets`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const createDatasetFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; payload: Record<string, any> }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/datasets`, {
      method: 'POST',
      body: JSON.stringify(data.payload),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const updateDatasetFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; datasetId: number; payload: Record<string, any> }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/datasets/${data.datasetId}`, {
      method: 'PUT',
      body: JSON.stringify(data.payload),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const deleteDatasetFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; datasetId: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/datasets/${data.datasetId}`, { method: 'DELETE' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const previewDatasetFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; sql: string; filters?: Record<string, any> }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/datasets/preview`, {
      method: 'POST',
      body: JSON.stringify({ sql: data.sql, filters: data.filters || {} }),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

// ============================================================
// COLUMNS
// ============================================================

export const getColumnsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/columns`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const createColumnFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; payload: Record<string, any> }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/columns`, {
      method: 'POST',
      body: JSON.stringify(data.payload),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const updateColumnFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; columnId: number; payload: Record<string, any> }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/columns/${data.columnId}`, {
      method: 'PUT',
      body: JSON.stringify(data.payload),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const deleteColumnFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; columnId: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/columns/${data.columnId}`, { method: 'DELETE' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

// ============================================================
// GROUPS
// ============================================================

export const getGroupsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/groups`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const createGroupFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; payload: Record<string, any> }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/groups`, {
      method: 'POST',
      body: JSON.stringify(data.payload),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const updateGroupFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; groupId: number; payload: Record<string, any> }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/groups/${data.groupId}`, {
      method: 'PUT',
      body: JSON.stringify(data.payload),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const deleteGroupFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; groupId: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/groups/${data.groupId}`, { method: 'DELETE' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

// ============================================================
// USER ACCESS
// ============================================================

export const getUserAccessFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/access`, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const grantAccessFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; payload: { USERID: string; Access?: boolean; IsDesign?: boolean; IsExport?: boolean } }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/access`, {
      method: 'POST',
      body: JSON.stringify(data.payload),
      headers: { 'Content-Type': 'application/json' }
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const revokeAccessFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; userId: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(`/api/admin/reports/${data.id}/access/${data.userId}`, { method: 'DELETE' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

export const getAllUsersFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/admin/reports/users', { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result
  })

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
