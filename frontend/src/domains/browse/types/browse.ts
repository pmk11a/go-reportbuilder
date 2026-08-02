/**
 * Browse domain types.
 *
 * Browse is a generic lookup facility that serves 19 different "kodeBrowse"
 * types (Perkiraan, Customer, Kas/Bank, etc.). The backend resolves each
 * kodeBrowse via either a hardcoded config map or the dbbrowseconfigs table.
 *
 * Because the row schema varies by kodeBrowse (different field names per
 * lookup), the frontend treats rows as a generic `Record<string, unknown>`
 * and uses the `keyField` / `labelField` from the IBrowseType metadata to
 * extract display values.
 */

/** Metadata for a registered browse type, returned by GET /api/browse/types */
export interface IBrowseType {
  /** Unique identifier (e.g. "1001" for Perkiraan, "1009" for Customer) */
  kodeBrowse: string
  /** Column name that holds the option value (e.g. "Kode") */
  keyField: string
  /** Column name that holds the display label (e.g. "Keterangan") */
  labelField: string
  /** Group label for UI organization (e.g. "perkiraan", "customer") */
  group: string
  /** Where the config was resolved from */
  source: 'hardcoded' | 'database'
}

export interface IColumnSchema {
  name: string
  dataType: string
  maxLength?: number
  isNullable: boolean
  isPrimaryKey: boolean
}

export interface ITableSchema {
  tableName: string
  columns: IColumnSchema[]
}

/**
 * A single row returned by search/all endpoints. The shape varies per
 * kodeBrowse, so consumers must use the IBrowseType metadata to know which
 * fields exist. Always treated as read-only data.
 */
export type IBrowseRow = Record<string, unknown>

/** Query parameters for browse search */
export interface IBrowseSearchParams {
  kodeBrowse: string
  /** Free-text search term */
  q?: string
  /** Max results to return (default 20) */
  limit?: number
  /** User permission mode (e.g. "A", "B", "C") — passed through */
  userMode?: string
  /**
   * Parent filter values. Keys are mapped to URL params as
   * `parent_<sourceColumn>=<value>` and substituted into placeholders
   * like `<P:KODE_CUST>` in the SQL query.
   */
  parentFilters?: Record<string, string | number>
}

/**
 * Query parameters for paginated browse search (/api/browse/paged).
 * Adds support for arbitrary `extraParams` (e.g. jenis, mode), sort
 * columns, and offset/limit pagination.
 */
export interface IBrowsePagedSearchParams extends IBrowseSearchParams {
  /** Search term (alias for `q` on the paged endpoint) */
  search?: string
  /** KodeBrowse-specific discriminator (e.g. "Y"/"T" for perkiraan, "Hutang"/"Piutang" for custsupp) */
  jenis?: string
  /** Column to sort by (defaults to labelField) */
  sortBy?: string
  /** Sort direction (ASC or DESC) */
  sortDir?: 'ASC' | 'DESC'
  /** Offset for pagination (default 0) */
  offset?: number
  /** Arbitrary extra params merged into the URL query string */
  extraParams?: Record<string, string | number | boolean>
}

/**
 * Response envelope for paginated browse search.
 * The backend returns this inside `response.data`.
 */
export interface IBrowsePagedResponse {
  items: IBrowseRow[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/** Single-code validation request body */
export interface IBrowseValidateRequest {
  kodeBrowse: string
  code: string
}

/** Batch validation request body */
export interface IBrowseValidateBatchRequest {
  kodeBrowse: string
  codes: string[]
}

/**
 * Response for batch validation: a map of code → row (or null if not found).
 * Codes that do not exist are returned with value `null`.
 */
export type IBrowseValidateBatchResponse = Record<string, IBrowseRow | null>

/**
 * Safely pick a field from a generic browse row.
 * Falls back to a default value when the field is missing or null.
 */
export function pickField<T = string>(
  row: IBrowseRow | null | undefined,
  name: string,
  fallback?: T
): T | undefined {
  if (!row) return fallback
  const value = row[name]
  if (value === null || value === undefined) return fallback
  return value as T
}

/**
 * Standardized option shape consumed by SearchableSelect.
 * Constructed by GenericBrowsePicker from IBrowseRow + IBrowseType metadata.
 */
export interface IBrowseOption {
  value: string
  label: string
  /** Original raw row for custom rendering */
  raw: IBrowseRow
}
