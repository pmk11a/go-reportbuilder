import { fetchHelper, APIError } from '@/lib/api'
import type { IAPIResponse } from '@/types/api'
import type {
  IPermissionReportFilters,
  IPermissionReportResponse,
} from '@/types/permissionReport'

const REPORT_ENDPOINT = '/admin/reports/permission-report'

/**
 * Translate the camelCase filter shape used in the UI into the snake-case
 * query params that the BFF (and the Go backend) expect.
 *
 * `menu_type === 'all'` is treated as "no filter" (the BFF/backend default
 * is `menu`; the UI exposes an "all" option as a UX convenience).
 */
function filtersToParams(
  filters: IPermissionReportFilters,
  format: 'json' | 'xlsx' | 'pdf'
): Record<string, string | number> {
  const params: Record<string, string | number> = { format }
  if (filters.user_id) params.userId = filters.user_id
  if (filters.menu_id) params.menuId = filters.menu_id
  if (filters.menu_type && filters.menu_type !== 'all') params.menuType = filters.menu_type
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.perPage = filters.per_page
  return params
}

/**
 * Guard for binary exports: the BFF enforces the same rule, but failing fast
 * here means we don't even waste a round-trip if the caller forgot to set
 * one of the required filters.
 */
function hasAtLeastOneFilter(filters: IPermissionReportFilters): boolean {
  return Boolean(filters.user_id || filters.menu_id)
}

/**
 * Direct, CSRF-aware fetch for binary blobs (xlsx / pdf). We can't use
 * `fetchHelper` here because that path always tries to parse the response
 * as JSON.
 *
 * We piggy-back on the global CSRF token by triggering one harmless
 * JSON request first to make sure the token is populated, then call
 * fetch() directly with the same `X-CSRF-Token` value.
 */
async function fetchBinary(
  filters: IPermissionReportFilters,
  format: 'xlsx' | 'pdf'
): Promise<Blob> {
  if (!hasAtLeastOneFilter(filters)) {
    throw new APIError(
      400,
      { message: 'Please apply at least one filter (user or menu) before exporting.' },
      'FILTER_REQUIRED'
    )
  }

  // The csrf-token endpoint is exempt from CSRF; calling it both bootstraps
  // and refreshes the cookie/header pair.
  const csrfRes = await fetch('/api/csrf-token', {
    method: 'GET',
    credentials: 'include',
  })
  const csrfJson = await csrfRes.json().catch(() => null)
  const csrfToken: string | null = csrfJson?.data?.token ?? null

  const params = filtersToParams(filters, format)
  const url = new URL(`/api${REPORT_ENDPOINT}`, window.location.origin)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)))

  const headers: Record<string, string> = {}
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    let message = `Export failed (HTTP ${response.status})`
    try {
      const payload = await response.json()
      message = payload?.message || message
    } catch {
      /* ignore parse failure — keep generic message */
    }
    throw new APIError(response.status, { message })
  }

  return await response.blob()
}

export const permissionReportService = {
  /**
   * Fetches the JSON matrix used by the on-screen table.
   *
   * The backend may return a 500 (e.g. when a column is missing in production)
   * and the BFF will forward the error envelope. We must always return a
   * well-shaped body so the consuming component's <Each of={rows}> never
   * throws "rows.map is not a function".
   */
  async getMatrix(filters: IPermissionReportFilters): Promise<IPermissionReportResponse> {
    const fallback: IPermissionReportResponse = {
      data: [],
      total: 0,
      page: filters.page ?? 1,
      per_page: filters.per_page ?? 50,
    }
    try {
      const params = filtersToParams(filters, 'json')
      const result = await fetchHelper<IAPIResponse<IPermissionReportResponse>>(REPORT_ENDPOINT, {
        method: 'GET',
        params,
      })
      // Hardening: never forward a non-array body to the page. If the BFF
      // returns an error envelope (success=false) or the data is malformed,
      // the page should render an empty state, not crash.
      if (result?.success === false) {
        return fallback
      }
      const body = result?.data
      if (!body || !Array.isArray(body.data)) {
        return fallback
      }
      return body
    } catch {
      // Network or parse failure — return the fallback rather than letting
      // the rejection bubble up to React Query (which would surface it as
      // an error toast, hiding the empty-state UX).
      return fallback
    }
  },

  /**
   * Downloads the Excel (.xlsx) export as a Blob. The caller is responsible
   * for turning the blob into a file (e.g. via `URL.createObjectURL`).
   */
  async downloadExcel(filters: IPermissionReportFilters): Promise<Blob> {
    return await fetchBinary(filters, 'xlsx')
  },

  /**
   * Downloads the PDF export as a Blob.
   */
  async downloadPDF(filters: IPermissionReportFilters): Promise<Blob> {
    return await fetchBinary(filters, 'pdf')
  },
}
