import {
  listBrowseTypesFn,
  searchBrowseFn,
  searchPagedBrowseFn,
  getAllBrowseFn,
  validateBrowseFn,
  validateBrowseBatchFn,
} from '@/server/functions/shared/browse'
import type {
  IBrowseType,
  IBrowseRow,
  IBrowseSearchParams,
  IBrowsePagedSearchParams,
  IBrowsePagedResponse,
  IBrowseValidateRequest,
  IBrowseValidateBatchRequest,
  IBrowseValidateBatchResponse,
} from '@/domains/browse/types/browse'

/**
 * Build a URLSearchParams string for /api/browse/search.
 * Parent filters become `parent_<sourceColumn>=<value>`.
 */
function buildSearchQuery(p: IBrowseSearchParams): string {
  const sp = new URLSearchParams()
  sp.set('kodeBrowse', p.kodeBrowse)
  if (p.q !== undefined && p.q !== null) sp.set('q', p.q)
  if (p.limit != null) sp.set('limit', String(p.limit))
  if (p.userMode) sp.set('userMode', p.userMode)
  if (p.parentFilters) {
    for (const [key, value] of Object.entries(p.parentFilters)) {
      if (value !== null && value !== undefined && value !== '') {
        sp.set(`parent_${key}`, String(value))
      }
    }
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

/**
 * Build a URLSearchParams string for /api/browse/all.
 * No parent filters — /all returns everything within limit.
 */
function buildAllQuery(kodeBrowse: string, limit: number, userMode?: string): string {
  const sp = new URLSearchParams()
  sp.set('kodeBrowse', kodeBrowse)
  sp.set('limit', String(limit))
  if (userMode) sp.set('userMode', userMode)
  return `?${sp.toString()}`
}

/**
 * Build a URLSearchParams string for /api/browse/paged.
 * Supports arbitrary extraParams (jenis, mode, etc.), sort columns,
 * and offset/limit pagination. extraParams take precedence over the
 * built-in fields when keys collide.
 */
function buildPagedQuery(p: IBrowsePagedSearchParams): string {
  const sp = new URLSearchParams()
  sp.set('kodeBrowse', p.kodeBrowse)

  const term = p.search ?? p.q
  if (term) sp.set('search', term)

  if (p.jenis) sp.set('jenis', p.jenis)
  if (p.sortBy) sp.set('sortBy', p.sortBy)
  if (p.sortDir) sp.set('sortDir', p.sortDir)
  if (p.limit != null) sp.set('limit', String(p.limit))
  if (p.offset != null) sp.set('offset', String(p.offset))
  if (p.userMode) sp.set('userMode', p.userMode)

  if (p.parentFilters) {
    for (const [key, value] of Object.entries(p.parentFilters)) {
      if (value !== null && value !== undefined && value !== '') {
        sp.set(`parent_${key}`, String(value))
      }
    }
  }

  if (p.extraParams) {
    for (const [key, value] of Object.entries(p.extraParams)) {
      if (value !== null && value !== undefined && value !== '') {
        sp.set(key, String(value))
      }
    }
  }

  const s = sp.toString()
  return s ? `?${s}` : ''
}

/**
 * Frontend service for the browse domain.
 *
 * This is the canonical entry point for all browse lookups. Consumers
 * should use this service rather than calling server functions directly,
 * to keep URL building, parent filters, and error handling in one place.
 *
 * Implementation note: server functions in `@/server/functions/shared/browse`
 * don't expose type info, so we cast at this boundary. The shape is
 * guaranteed by the typed validator chain in the server function file.
 */
export const browseService = {
  /** GET /api/browse/types */
  async listTypes(): Promise<IBrowseType[]> {
    const result = (await listBrowseTypesFn()) as IBrowseType[] | null | undefined
    // The backend returns {"data": [...]} wrapped in the response envelope.
    // If result is not already an array, unwrap the inner data field.
    if (!Array.isArray(result)) {
      return (result as any)?.data ?? []
    }
    return result
  },

  /** GET /api/browse/search?kodeBrowse=...&q=...&parent_<col>=... */
  async search(params: IBrowseSearchParams): Promise<IBrowseRow[]> {
    const result = (await searchBrowseFn({
      data: { query: buildSearchQuery(params) },
    })) as IBrowseRow[] | null | undefined
    return result ?? []
  },

  /**
   * GET /api/browse/paged?kodeBrowse=...&search=...&jenis=...&sortBy=...&sortDir=...
   * Paginated search with total/hasMore metadata. Use this for large
   * pickers (Kas/Bank, Customer/Supplier) where the dataset is too big
   * for the simple /search endpoint.
   */
  async searchPaged(params: IBrowsePagedSearchParams): Promise<IBrowsePagedResponse> {
    const result = (await searchPagedBrowseFn({
      data: { query: buildPagedQuery(params) },
    })) as IBrowsePagedResponse | null | undefined
    return result ?? { items: [], total: 0, limit: params.limit ?? 20, offset: params.offset ?? 0, hasMore: false }
  },

  /** GET /api/browse/all?kodeBrowse=...&limit=... */
  async getAll(
    kodeBrowse: string,
    limit: number = 500,
    userMode?: string
  ): Promise<IBrowseRow[]> {
    const result = (await getAllBrowseFn({
      data: { query: buildAllQuery(kodeBrowse, limit, userMode) },
    })) as IBrowseRow[] | null | undefined
    return result ?? []
  },

  /** POST /api/browse/validate */
  async validate(req: IBrowseValidateRequest): Promise<IBrowseRow | null> {
    const result = (await validateBrowseFn({
      data: req,
    })) as IBrowseRow | null | undefined
    return result ?? null
  },

  /** POST /api/browse/validate-batch */
  async validateBatch(
    req: IBrowseValidateBatchRequest
  ): Promise<IBrowseValidateBatchResponse> {
    const result = (await validateBrowseBatchFn({
      data: req,
    })) as IBrowseValidateBatchResponse | null | undefined
    return result ?? {}
  },
}
