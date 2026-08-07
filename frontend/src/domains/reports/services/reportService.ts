// Report Service - backend API calls for reports

import * as adminReportsFn from '@/server/functions/admin/reports'
import * as userReportsFn from '@/server/functions/reports'
import type { ExportReportParams } from '@/server/functions/reports'
import type {
  IReport,
  IReportConfig,
  IReportFilter,
  IReportDataset,
  IReportColumn,
  IReportGroup,
  IReportUserAccess,
  IAvailableKodeMenu,
  IReportFilterValues,
  IQueryPreviewResult,
  IReportMenuItem,
  IReportExecutionResult,
  IReportListResponse,
} from '../types'

// ============================================================
// ADMIN OPERATIONS
// ============================================================

export const reportService = {
  // Reports CRUD
  async listReports(params?: { page?: number; limit?: number; search?: string }): Promise<IReportListResponse> {
    const result = await adminReportsFn.listReportsFn({ data: params || {} })
    return {
      items: result.data?.reports || [],
      total: result.data?.total || 0,
      page: result.data?.page || 1,
      perPage: result.data?.limit || 10,
    }
  },

  async getReport(id: number): Promise<IReportConfig | null> {
    const result = await adminReportsFn.getReportFn({ data: { id } })
    return result.data || null
  },

  async createReport(data: {
    KODEMENU: string
    nama_laporan: string
    deskripsi?: string
    status_aktif?: boolean
    footer_bands?: any
  }): Promise<IReport | null> {
    const result = await adminReportsFn.createReportFn({ data })
    return result.data || null
  },

  async updateReport(id: number, payload: Partial<IReport>): Promise<boolean> {
    const result = await adminReportsFn.updateReportFn({ data: { id, payload } })
    return result.success
  },

  async deleteReport(id: number): Promise<boolean> {
    const result = await adminReportsFn.deleteReportFn({ data: { id } })
    return result.success
  },

  async getAvailableKodeMenu(): Promise<IAvailableKodeMenu[]> {
    const result = await adminReportsFn.getAvailableKodeMenuFn()
    return result.data || []
  },

  // Filters CRUD
  async getFilters(id: number): Promise<IReportFilter[]> {
    const result = await adminReportsFn.getFiltersFn({ data: { id } })
    return result.data || []
  },

  async createFilter(id: number, payload: Partial<IReportFilter>): Promise<IReportFilter | null> {
    const result = await adminReportsFn.createFilterFn({ data: { id, payload } })
    return result.data || null
  },

  async updateFilter(id: number, filterId: number, payload: Partial<IReportFilter>): Promise<boolean> {
    const result = await adminReportsFn.updateFilterFn({ data: { id, filterId, payload } })
    return result.success
  },

  async deleteFilter(id: number, filterId: number): Promise<boolean> {
    const result = await adminReportsFn.deleteFilterFn({ data: { id, filterId } })
    return result.success
  },

  // Datasets CRUD
  async getDatasets(id: number): Promise<IReportDataset[]> {
    const result = await adminReportsFn.getDatasetsFn({ data: { id } })
    return result.data || []
  },

  async createDataset(id: number, payload: Partial<IReportDataset>): Promise<IReportDataset | null> {
    const result = await adminReportsFn.createDatasetFn({ data: { id, payload } })
    return result.data || null
  },

  async updateDataset(id: number, datasetId: number, payload: Partial<IReportDataset>): Promise<boolean> {
    const result = await adminReportsFn.updateDatasetFn({ data: { id, datasetId, payload } })
    return result.success
  },

  async deleteDataset(id: number, datasetId: number): Promise<boolean> {
    const result = await adminReportsFn.deleteDatasetFn({ data: { id, datasetId } })
    return result.success
  },

  async previewDataset(id: number, sql: string, filters?: Record<string, any>): Promise<IQueryPreviewResult> {
    const result = await adminReportsFn.previewDatasetFn({ data: { id, sql, filters } })
    return result.data || { success: false, message: 'Preview failed' }
  },

  // Columns CRUD
  async getColumns(id: number): Promise<Record<string, IReportColumn[]>> {
    const result = await adminReportsFn.getColumnsFn({ data: { id } })
    return result.data || {}
  },

  async createColumn(id: number, payload: Partial<IReportColumn>): Promise<IReportColumn | null> {
    const result = await adminReportsFn.createColumnFn({ data: { id, payload } })
    return result.data || null
  },

  async updateColumn(id: number, columnId: number, payload: Partial<IReportColumn>): Promise<boolean> {
    const result = await adminReportsFn.updateColumnFn({ data: { id, columnId, payload } })
    return result.success
  },

  async deleteColumn(id: number, columnId: number): Promise<boolean> {
    const result = await adminReportsFn.deleteColumnFn({ data: { id, columnId } })
    return result.success
  },

  // Groups CRUD
  async getGroups(id: number): Promise<IReportGroup[]> {
    const result = await adminReportsFn.getGroupsFn({ data: { id } })
    return result.data || []
  },

  async createGroup(id: number, payload: Partial<IReportGroup>): Promise<IReportGroup | null> {
    const result = await adminReportsFn.createGroupFn({ data: { id, payload } })
    return result.data || null
  },

  async updateGroup(id: number, groupId: number, payload: Partial<IReportGroup>): Promise<boolean> {
    const result = await adminReportsFn.updateGroupFn({ data: { id, groupId, payload } })
    return result.success
  },

  async deleteGroup(id: number, groupId: number): Promise<boolean> {
    const result = await adminReportsFn.deleteGroupFn({ data: { id, groupId } })
    return result.success
  },

  // User Access
  async getUserAccess(id: number): Promise<IReportUserAccess[]> {
    const result = await adminReportsFn.getUserAccessFn({ data: { id } })
    return result.data || []
  },

  async grantAccess(id: number, payload: { USERID: string; Access?: boolean; IsDesign?: boolean; IsExport?: boolean }): Promise<boolean> {
    const result = await adminReportsFn.grantAccessFn({ data: { id, payload } })
    return result.success
  },

  async revokeAccess(id: number, userId: string): Promise<boolean> {
    const result = await adminReportsFn.revokeAccessFn({ data: { id, userId } })
    return result.success
  },

  async getAllUsers(): Promise<{ USERID: string; FullName: string }[]> {
    const result = await adminReportsFn.getAllUsersFn()
    return result.data || []
  },
}

// ============================================================
// USER OPERATIONS
// ============================================================

export const reportViewerService = {
  async getReportsMenu(searchQuery?: string): Promise<IReportMenuItem[]> {
    const result = await userReportsFn.getReportsMenuFn({ data: { q: searchQuery } })
    return result.data as IReportMenuItem[]
  },

  async getReportConfig(kodeMenu: string): Promise<IReportConfig | null> {
    const result = await userReportsFn.getReportConfigFn({ data: { kodeMenu } })
    return result.data || null
  },

  async executeReport(kodeMenu: string, filters: IReportFilterValues): Promise<IReportExecutionResult | null> {
    const result = await userReportsFn.executeReportFn({ data: { kodeMenu, filters } })
    return result.data || null
  },

  async exportReport(params: ExportReportParams): Promise<{ filename: string; blob: Blob } | null> {
    const result = await userReportsFn.exportReportFn({ data: params })
    if (!result.success || !result.data?.base64) return null

    const binary = atob(result.data.base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: result.data.contentType })
    return { filename: result.data.filename, blob }
  },

  async downloadReport(params: ExportReportParams): Promise<void> {
    const file = await this.exportReport(params)
    if (!file) return

    const url = URL.createObjectURL(file.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}
