import {
  listBrowseTypesFn,
  searchBrowseFn,
  searchPagedBrowseFn,
  getAllBrowseFn,
  validateBrowseFn,
  validateBrowseBatchFn,
  listBrowseConfigsFn,
  createBrowseConfigFn,
  updateBrowseConfigFn,
  deleteBrowseConfigFn,
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
  /**
   * Get all browse types (paginated & searchable)
   */
  async listTypes(params?: { q?: string, page?: number, limit?: number }): Promise<{ items: IBrowseType[], meta: { total: number } }> {
    const sp = new URLSearchParams()
    if (params?.q) sp.set('q', params.q)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.limit) sp.set('limit', String(params.limit))
    
    const query = sp.toString()
    const res = await listBrowseTypesFn({ 
      data: { query: query ? `?${query}` : undefined } 
    })
    
    // Check if the backend returned a paginated response (has data and pagination)
    if (res && (res as any).data !== undefined && (res as any).pagination !== undefined) {
      return { 
        items: (res as any).data || [], 
        meta: { total: (res as any).pagination.total || 0 } 
      }
    }
    
    // Fallback if backend hasn't been updated yet or returned an array
    if (Array.isArray(res)) {
      return { items: res, meta: { total: res.length } }
    }
    
    return { items: [], meta: { total: 0 } }
  },

  /** GET /api/browse/search?kodeBrowse=...&q=...&parent_<col>=... */
  async search(params: IBrowseSearchParams): Promise<IBrowseRow[]> {
    const result = (await searchBrowseFn({
      data: { query: buildSearchQuery(params) },
    })) as IBrowseRow[] | null | undefined
    // Defensive: same as listTypes — unwrap wrapper if present.
    if (Array.isArray(result)) return result
    return ((result as any)?.data as IBrowseRow[] | undefined) ?? []
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
    // Defensive: unwrap wrapper if backend returned {data:[...]}.
    if (Array.isArray(result)) return result
    return ((result as any)?.data as IBrowseRow[] | undefined) ?? []
  },

  /** POST /api/browse/validate */
  async validate(req: IBrowseValidateRequest): Promise<IBrowseRow | null> {
    const result = (await validateBrowseFn({
      data: req,
    })) as IBrowseRow | { data?: IBrowseRow | null } | null | undefined
    // validate returns a single row (or null). Backend may wrap it.
    if (result == null) return null
    if (typeof result === 'object' && 'Perkiraan' in (result as object)) {
      return result as IBrowseRow
    }
    return ((result as any)?.data as IBrowseRow | null | undefined) ?? null
  },

  /** POST /api/browse/validate-batch */
  async validateBatch(
    req: IBrowseValidateBatchRequest
  ): Promise<IBrowseValidateBatchResponse> {
    const result = (await validateBrowseBatchFn({
      data: req,
    })) as IBrowseValidateBatchResponse | { data?: IBrowseValidateBatchResponse } | null | undefined
    if (result && typeof result === 'object' && 'results' in (result as object)) {
      return result as IBrowseValidateBatchResponse
    }
    return ((result as any)?.data as IBrowseValidateBatchResponse | undefined) ?? {}
  },

  /** GET /api/browse/configs */
  async listConfigs(params?: { page?: number; limit?: number; search?: string }) {
    const sp = new URLSearchParams()
    if (params?.page) sp.set('page', String(params.page))
    if (params?.limit) sp.set('limit', String(params.limit))
    if (params?.search) sp.set('search', params.search)

    const query = sp.toString()
    const result = await listBrowseConfigsFn({
      data: { query: query ? `?${query}` : undefined },
    })
    return result
  },

  /** POST /api/browse/configs */
  async createConfig(payload: any): Promise<void> {
    await createBrowseConfigFn({ data: payload })
  },

  /** PUT /api/browse/configs/:id */
  async updateConfig(id: number, payload: any): Promise<void> {
    await updateBrowseConfigFn({ data: { id, payload } })
  },

  /** DELETE /api/browse/configs/:id */
  async deleteConfig(id: number): Promise<void> {
    await deleteBrowseConfigFn({ data: { id } })
  },
}
