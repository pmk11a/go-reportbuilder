import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { makeBackendRequest } from '../../backend'

/**
 * GET /api/browse/types
 * Returns metadata for all registered browse types. Used by the picker to
 * discover keyField/labelField defaults without code generation.
 */
export const listBrowseTypesFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      '/api/browse/types',
      { method: 'GET' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

/**
 * GET /api/browse/search?kodeBrowse=...&q=...&limit=...&userMode=...&parent_<col>=...
 * Free-text search across a browse type's configured field list. Parent
 * filters are injected via `parent_<sourceColumn>` keys.
 *
 * The caller pre-builds the query string because parameter names (parent_<col>)
 * are dynamic and cannot be statically typed.
 */
export const searchBrowseFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { query: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const url = data.query
      ? `/api/browse/search${data.query.startsWith('?') ? data.query : `?${data.query}`}`
      : '/api/browse/search'
    const result = await makeBackendRequest(url, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

/**
 * GET /api/browse/all?kodeBrowse=...&limit=...&userMode=...
 * Returns all rows for a browse type up to `limit` (default 500).
 * Used when a dropdown needs the full list (e.g. small lookup like Dept).
 */
export const getAllBrowseFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { query: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const url = data.query
      ? `/api/browse/all${data.query.startsWith('?') ? data.query : `?${data.query}`}`
      : '/api/browse/all'
    const result = await makeBackendRequest(url, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

/**
 * GET /api/browse/paged?kodeBrowse=...&search=...&jenis=...&sortBy=...&sortDir=...
 * Returns paginated rows for a browse type along with total/hasMore metadata.
 * Designed for Kas/Bank and customer/supplier pickers that need infinite
 * scroll and the "jenis" (Kas/Bank or Hutang/Piutang) discriminator.
 */
export const searchPagedBrowseFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { query: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const url = data.query
      ? `/api/browse/paged${data.query.startsWith('?') ? data.query : `?${data.query}`}`
      : '/api/browse/paged'
    const result = await makeBackendRequest(url, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

/**
 * POST /api/browse/validate
 * Validate a single code against a browse type. Returns the row if it
 * exists, throws Error otherwise (caller should catch and handle as 404).
 */
export const validateBrowseFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: any) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      '/api/browse/validate',
      { method: 'POST', body: JSON.stringify(data) },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

/**
 * POST /api/browse/validate-batch
 * Validate many codes at once. Server returns a map of code → row (or null).
 * Codes that do not exist are returned with value `null` (NOT an error).
 */
export const validateBrowseBatchFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: any) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      '/api/browse/validate-batch',
      { method: 'POST', body: JSON.stringify(data) },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })