/**
 * Permission Report types.
 *
 * These mirror the backend DTO at:
 *   backend/internal/dto/report_dto.go - SPermissionReportRowDTO / SPermissionReportResponse / SReportFilters
 *
 * Field names use snake_case to match the backend JSON tags.
 */

/**
 * A single row in the permission report matrix.
 * Each row represents one (user, menu) pair plus all granular permission flags.
 */
export interface IPermissionReportRow {
  user_id: string
  username: string
  full_name: string
  role: string
  menu_code: string
  menu_name: string
  menu_type: string // "menu" or "report"
  has_access: number
  is_create: number
  is_update: number
  is_delete: number
  is_print: number
  is_export: number
  is_approve_1: number
  is_approve_2: number
  is_approve_3: number
  is_approve_4: number
  is_approve_5: number
  is_canceled: number
}

/**
 * Paginated JSON response for /admin/reports/permissions?format=json
 */
export interface IPermissionReportResponse {
  data: IPermissionReportRow[]
  total: number
  page: number
  per_page: number
}

/**
 * Menu type filter — controls which underlying table is queried on the backend.
 *  - "menu"   → dbmenu (default)
 *  - "report" → dbmenureport
 *  - "all"    → both (UI-only convenience; the BFF treats empty/missing as "all")
 */
export type TMenuTypeFilter = 'menu' | 'report' | 'all'

/**
 * The filter shape consumed by the permission report service. All fields are
 * optional from the UI's perspective; only `menu_type` has a sensible default.
 */
export interface IPermissionReportFilters {
  user_id?: string
  menu_id?: string
  menu_type?: TMenuTypeFilter
  page?: number
  per_page?: number
}
