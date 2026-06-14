import { getPermissionReportFn, downloadPermissionReportFn } from '@/server/functions/admin/reports'
import type { IPermissionReportFilters, IPermissionReportResponse } from '@/domains/reports/permissionReport'

function filtersToQuery(filters: IPermissionReportFilters, format: string): string {
  const params = new URLSearchParams({ format })
  if (filters.user_id) params.append('userId', String(filters.user_id))
  if (filters.menu_id) params.append('menuId', String(filters.menu_id))
  if (filters.menu_type && filters.menu_type !== 'all') params.append('menuType', filters.menu_type)
  if (filters.page) params.append('page', String(filters.page))
  if (filters.per_page) params.append('perPage', String(filters.per_page))
  return `?${params.toString()}`
}

export const permissionReportService = {
  async getMatrix(filters: IPermissionReportFilters): Promise<IPermissionReportResponse> {
    const fallback: IPermissionReportResponse = {
      data: [],
      total: 0,
      page: filters.page ?? 1,
      per_page: filters.per_page ?? 50,
    }
    try {
      const query = filtersToQuery(filters, 'json')
      const result = await getPermissionReportFn({ data: { query } })
      const body = result?.data
      if (!body || !Array.isArray(body.data)) return fallback
      return body as any
    } catch {
      return fallback
    }
  },

  async downloadExcel(filters: IPermissionReportFilters): Promise<Blob> {
    const query = filtersToQuery(filters, 'xlsx')
    const result = await downloadPermissionReportFn({ data: { format: 'xlsx', query } })
    return new Blob([new Uint8Array(result.buffer)], { type: result.contentType })
  },

  async downloadPDF(filters: IPermissionReportFilters): Promise<Blob> {
    const query = filtersToQuery(filters, 'pdf')
    const result = await downloadPermissionReportFn({ data: { format: 'pdf', query } })
    return new Blob([new Uint8Array(result.buffer)], { type: result.contentType })
  },
}
