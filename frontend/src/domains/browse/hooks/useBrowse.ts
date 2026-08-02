import { useQuery, useQueryClient, useInfiniteQuery, useMutation } from '@tanstack/react-query'
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
  types: (q?: string) => ['browse', 'types', q] as const,
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
    queryFn: async () => {
      const res = await browseService.listTypes({ limit: 1000 })
      return res.items
    },
    select: (data: any) => {
      // Handle cases where the old { items, meta } object is still in the local cache
      return Array.isArray(data) ? data : (data?.items || [])
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}

/**
 * Returns paginated browse types for infinite scroll lists.
 */
export function useBrowseTypesInfinite(q?: string, limit: number = 20) {
  return useInfiniteQuery({
    queryKey: browseKeys.types(q),
    queryFn: async ({ pageParam = 1 }) => {
      return browseService.listTypes({ q, page: pageParam as number, limit })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const currentCount = allPages.length * limit
      return currentCount < lastPage.meta.total ? allPages.length + 1 : undefined
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
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

/**
 * Hook to get paginated configs
 */
export function useBrowseConfigs(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [...browseKeys.all, 'configs', params],
    queryFn: () => browseService.listConfigs(params),
  })
}

/**
 * Mutation to create a new browse config.
 */
export function useBrowseConfigCreate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: any) => browseService.createConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: browseKeys.all })
    },
  })
}

/**
 * Mutation to update an existing browse config.
 */
export function useBrowseConfigUpdate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      browseService.updateConfig(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: browseKeys.all })
    },
  })
}

/**
 * Mutation to delete a browse config.
 */
export function useBrowseConfigDelete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => browseService.deleteConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: browseKeys.all })
    },
  })
}