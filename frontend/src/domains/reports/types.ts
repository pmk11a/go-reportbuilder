/**
 * Report domain types.
 *
 * These mirror the backend entities:
 *   - SDBMasterLaporan (report definitions)
 *   - SDBQueryLaporan (datasets)
 *   - SDBParameterLaporan (filters)
 *   - SDBKolomLaporan (columns)
 *   - SDBGroupLaporan (grouping)
 *
 * Field names use snake_case to match the backend JSON tags.
 */

// ============================================================
// Report Types
// ============================================================

/**
 * A single report definition from SDBMasterLaporan.
 */
export interface IReport {
  id_laporan: number
  KODEMENU: string
  nama_laporan: string
  deskripsi: string | null
  status_aktif: boolean
  footer_bands: Record<string, any> | null
  created_at: string
  updated_at: string
  Keterangan?: string | null
  L0?: number | null
  icon?: string | null
}

/**
 * Full report configuration including filters, datasets, columns, and groups.
 * Extends IReport with all related configuration.
 */
export interface IReportConfig extends IReport {
  filters: IReportFilter[]
  datasets: IReportDataset[]
  columns: Record<string, IReportColumn[]>
  groups: IReportGroup[]
  komponen?: IReportComponent[]
}

// ============================================================
// Filter Types
// ============================================================

/**
 * A report filter from SDBParameterLaporan.
 */
export interface IReportFilter {
  id_parameter: number
  id_laporan: number
  nama_filter: string
  label: string
  tipe_input: IFilterInputType
  wajib_isi: boolean
  nilai_default: string | null
  posisi: number
  konfigurasi: IFilterKonfigurasi | null
}

/**
 * Supported filter input types.
 */
export type IFilterInputType =
  | 'date'
  | 'text'
  | 'number'
  | 'combobox'
  | 'browse'
  | 'perkiraan'
  | 'dropdown'
  | 'checkbox'

/**
 * Additional configuration for a filter.
 */
export interface IFilterKonfigurasi {
  /** Browse code for lookup-type filters */
  kode_browse?: string
  /** Display mode: checkbox or dropdown */
  mode?: 'checkbox' | 'dropdown'
  /** Parent filter name for dependent filters */
  parent_filter?: string
  /** Multiple parent filter dependencies */
  parent_filters?: IParentFilter[]
  /** Dropdown/checkbox options for tipe_input: dropdown or checkbox */
  options?: string[]
  /** Human-readable label map for option values (e.g. { T: "Terbit", F: "Tidak Terbit" }) */
  label_map?: Record<string, string>
  /** Whether the combobox allows multi-select */
  multi?: boolean
}

/**
 * Parent filter dependency definition.
 */
export interface IParentFilter {
  /** Source filter name */
  source: string
  /** Target field name */
  target?: string
  /** Comparison operator */
  operator?: string
  /** Value type */
  type?: string
}

// ============================================================
// Dataset Types
// ============================================================

/**
 * A dataset from SDBQueryLaporan.
 */
export interface IReportDataset {
  id_query: number
  id_laporan: number
  nama_dataset: string
  deskripsi: string | null
  query_sumber_data: string
  urutan: number
  visible: boolean
  config_json?: IDatasetConfig | null
}

/**
 * Dataset configuration from config_json field.
 */
export interface IDatasetConfig {
  /** Display role: summary or detail */
  display_role?: 'summary' | 'detail'
  /** Summary layout: 2-column grid or single column */
  summary_layout?: 'grid_2col' | 'grid_1col'
  /** Detail dataset name for drill-down */
  detail_dataset?: string
  /** Fields to sum from T2 dataset */
  t2_sum_fields?: string[]
  /** Fields for bon/giro display */
  bon_giro_fields?: string[]
  /** Fields to include in summary */
  summary_fields?: string[]
  /** Fields aligned to the right */
  right_fields?: string[]
  /** Computed columns with expressions */
  computed?: Record<string, IComputedColumn>
  detail_layout: string
}

/**
 * Computed column definition.
 */
export interface IComputedColumn {
  /** Expression string */
  expression: string
  /** Operand sources */
  operands: Record<string, IOperandSource>
}

/**
 * Operand source type.
 */
export type IOperandSource = 't1' | 'sum:t1' | 'sum:t2'

// ============================================================
// Column Types
// ============================================================

/**
 * A column definition from SDBKolomLaporan.
 */
export interface IReportColumn {
  id_kolom: number
  id_laporan: number
  nama_dataset: string
  nama_kolom: string
  label_tampil: string
  urutan_tampil: number
  format_type: IColumnFormatType
  alignment: IColumnAlignment
  is_summable: boolean
  is_visible: boolean
}

/**
 * Supported column format types.
 */
export type IColumnFormatType = 'text' | 'date' | 'number' | 'currency'

/**
 * Column text alignment.
 */
export type IColumnAlignment = 'left' | 'center' | 'right'

// ============================================================
// Group Types
// ============================================================

/**
 * A grouping definition from SDBGroupLaporan.
 */
export interface IReportGroup {
  id_group: number
  id_laporan: number
  group_level: number
  group_field: string | null
  field_value: string | null
  label: string
  sort_order: number
  show_subtotal: boolean
  style_config: Record<string, any> | null
  special_handling: IGroupSpecialHandling
  config_json: Record<string, any> | null
}

/**
 * Special grouping handling strategies.
 */
export type IGroupSpecialHandling = 'default' | 'running-balance' | 'category-label'

// ============================================================
// Component Layout Types
// ============================================================

/**
 * A layout component from SDBKomponenLaporan.
 */
export interface IReportComponent {
  id_komponen: number
  id_laporan?: number
  nama_komponen: string
  konfigurasi_layout: Record<string, any>
  urutan: number
  is_active?: boolean
}

// ============================================================
// Execution Result Types
// ============================================================

/**
 * Report execution result from the engine.
 */
export interface IReportExecutionResult {
  /** Dataset name -> rows */
  datasets: Record<string, Record<string, any>[]>
  /** Data organized by grouping levels */
  groupedData: Record<string, any> | null
  /** Sum of summable columns */
  grandTotal: Record<string, number>
  /** Full report configuration */
  config: IReportConfig
  /** Grouping strategy configuration */
  groupingConfig: IGroupingConfig | null
  /** Any errors encountered during execution */
  errors?: string[]
}

/**
 * Grouping strategy configuration.
 */
export interface IGroupingConfig {
  /** Special handling type */
  specialHandling: string
  /** Additional configuration */
  config: Record<string, any>
  /** Group definitions */
  groups: IReportGroup[]
}

// ============================================================
// Menu Types
// ============================================================

/**
 * A menu item in the report navigation tree.
 */
export interface IReportMenuItem {
  /** Menu code from dbmenureport */
  KODEMENU: string
  /** Report display name */
  NmReport: string
  /** Hierarchy level */
  L0: number
  /** Access level */
  ACCESS: string
  /** Child menu items */
  children: IReportMenuItem[]
}

// ============================================================
// User Access Types
// ============================================================

/**
 * User's report access permissions.
 */
export interface IReportUserAccess {
  /** User ID */
  USERID: string
  /** User full name */
  FullName: string
  /** Can view the report */
  Access: boolean
  /** Can modify report design */
  IsDesign: boolean
  /** Can export the report */
  IsExport: boolean
}

/**
 * Available report menu codes for the user.
 */
export interface IAvailableKodeMenu {
  /** Menu code */
  KODEMENU: string
  /** Menu description */
  Keterangan: string
}

// ============================================================
// Filter Form State
// ============================================================

/**
 * Runtime filter values submitted to execute a report.
 */
export interface IReportFilterValues {
  /** Filter name -> value mapping */
  [filterName: string]: string | string[] | null
}

// ============================================================
// Preview Query Result
// ============================================================

/**
 * Result of previewing a dataset query.
 */
export interface IQueryPreviewResult {
  /** Whether the preview succeeded */
  success: boolean
  /** Column names from the query result */
  columns?: string[]
  /** Row data */
  rows?: Record<string, any>[]
  /** Number of rows returned */
  rowCount?: number
  /** Error or info message */
  message?: string
}

// ============================================================
// List / Pagination Types
// ============================================================

/**
 * Query parameters for listing reports.
 */
export interface IReportListParams {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive' | 'all'
  kodeMenu?: string
}

/**
 * Paginated list response for reports.
 */
export interface IReportListResponse {
  items: IReport[]
  total: number
  page: number
  perPage: number
}
