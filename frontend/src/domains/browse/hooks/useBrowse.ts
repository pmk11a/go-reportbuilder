import { useQuery, useQueryClient } from '@tanstack/react-query'
import { browseService } from '@/domains/browse/services/browseService'
import type {
  IBrowseSearchParams,
  IBrowsePagedSearchParams,
  IBrowsePagedResponse,
  IBrowseRow,
} from '@/domains/browse/types/browse'

/**
 * Centralized query keys for the browse domain.
 * Use `browseKeys.all` to invalidate every browse query (e.g. after a
 * bulk import that adds new Perkiraan codes).
 */
export const browseKeys = {
  all: ['browse'] as const,
  types: () => ['browse', 'types'] as const,
  search: (params: IBrowseSearchParams) => ['browse', 'search', params] as const,
  paged: (params: IBrowsePagedSearchParams) => ['browse', 'paged', params] as const,
  allRecords: (kodeBrowse: string, limit: number, userMode?: string) =>
    ['browse', 'all', kodeBrowse, limit, userMode] as const,
  validate: (kodeBrowse: string, code: string) =>
    ['browse', 'validate', kodeBrowse, code] as const,
}

/**
 * Returns metadata for all registered browse types. Types are very stable
 * (config changes only via DB migration), so staleTime is long.
 */
export function useBrowseTypes() {
  return useQuery({
    queryKey: browseKeys.types(),
    queryFn: () => browseService.listTypes(),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}

/**
 * Returns all rows for a browse type up to `limit`. Use this when the
 * dataset is known to be small (Departemen, Perkiraan type, etc.) and the
 * UI benefits from instant local filtering.
 */
export function useBrowseAll(kodeBrowse: string, limit: number = 500, userMode?: string) {
  return useQuery({
    queryKey: browseKeys.allRecords(kodeBrowse, limit, userMode),
    queryFn: () => browseService.getAll(kodeBrowse, limit, userMode),
    enabled: !!kodeBrowse,
    staleTime: 5 * 60 * 1000, // 5 min
  })
}

/**
 * Validates a single code against a browse type. Use to render a label
 * for a code the user has already selected (e.g. "1101101 - BANK BRI").
 *
 * Returns the row on success, null on 404.
 */
export function useBrowseValidate(kodeBrowse: string, code: string) {
  return useQuery({
    queryKey: browseKeys.validate(kodeBrowse, code),
    queryFn: () => browseService.validate({ kodeBrowse, code }),
    enabled: !!kodeBrowse && !!code,
    staleTime: 60 * 1000, // 1 min
    retry: false, // 404 is expected for missing codes, don't retry
  })
}

/**
 * Imperative helper to invalidate all browse caches (e.g. after importing
 * a new master data file that added new Perkiraan codes).
 */
export function useInvalidateBrowse() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: browseKeys.all })
}

/**
 * Convenience: synchronously pull all rows for a browse type without
 * subscribing to query state. Use for one-off operations like building a
 * static lookup map at form-render time.
 */
export async function fetchBrowseAll(
  kodeBrowse: string,
  limit: number = 500,
  userMode?: string
): Promise<IBrowseRow[]> {
  return browseService.getAll(kodeBrowse, limit, userMode)
}

/**
 * Paginated browse search with total/hasMore metadata. Designed for the
 * Kas/Bank and Customer/Supplier pickers where the dataset is too large
 * for a single /search response and infinite scroll is required.
 *
 * Pass `jenis` to discriminate rows (e.g. "Y" for Kas-only on Perkiraan,
 * "Hutang"/"Piutang" on Customer). Pass `parentFilters` for context-bound
 * pickers (e.g. customer of a specific division). `extraParams` is merged
 * into the URL for any additional query string the backend supports.
 */
export function useBrowsePaged(
  params: IBrowsePagedSearchParams,
  options?: { enabled?: boolean }
) {
  return useQuery<IBrowsePagedResponse>({
    queryKey: browseKeys.paged(params),
    queryFn: () => browseService.searchPaged(params),
    enabled: options?.enabled ?? !!params.kodeBrowse,
    staleTime: 30 * 1000, // 30s — pagination metadata changes as user scrolls
  })
}