import { useEffect, useState, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { browseService } from '@/domains/browse/services/browseService'
import { browseKeys } from '@/domains/browse/hooks/useBrowse'
import type { IBrowseSearchParams, IBrowseRow } from '@/domains/browse/types/browse'

interface UseBrowseSearchOptions {
  kodeBrowse: string
  parentFilters?: Record<string, string | number>
  userMode?: string
  debounceMs?: number
  minChars?: number
  limit?: number
}

interface UseBrowseSearchReturn {
  options: IBrowseRow[]
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  /** Handler to wire to SearchableSelect's `onSearchChange` */
  onSearchChange: (value: string) => void
  /** Whether the user has typed enough characters to trigger a backend request */
  hasSearched: boolean
  /** Currently selected key/value (for showing selected label even when search is empty) */
  selectedRow?: IBrowseRow | null
}

/**
 * Debounced search for browse pickers.
 *
 * Wire up by passing `onSearchChange` to `<SearchableSelect onSearchChange={...} />`.
 * The hook handles debouncing, the minChars guard, and TanStack Query caching.
 *
 * Behavior:
 * - Initial state: `options` is `[]`. User must type ≥ minChars to trigger backend.
 * - After search fires: `options` becomes the backend result set.
 * - The SearchableSelect's internal `searchValue` is mirrored here so the
 *   backend query uses the same string the user typed.
 *
 * @example
 * ```tsx
 * const { options, isLoading, onSearchChange } = useBrowseSearch({
 *   kodeBrowse: '1001', // Perkiraan
 *   minChars: 2,
 * })
 *
 * const selectOptions = options.map(row => ({
 *   value: String(row.Kode),
 *   label: String(row.Keterangan),
 * }))
 *
 * return <SearchableSelect onSearchChange={onSearchChange} options={selectOptions} ... />
 * ```
 */
export function useBrowseSearch(opts: UseBrowseSearchOptions): UseBrowseSearchReturn {
  const {
    kodeBrowse,
    parentFilters,
    userMode,
    debounceMs = 300,
    minChars = 2,
    limit = 20,
  } = opts

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const timerRef = useRef<number | null>(null)

  // Debounce: wait N ms after last keystroke before firing the request
  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, debounceMs)
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [searchInput, debounceMs])

  const hasSearched = debouncedSearch.length >= minChars

  const params: IBrowseSearchParams = useMemo(
    () => ({
      kodeBrowse,
      q: debouncedSearch,
      limit,
      userMode,
      parentFilters,
    }),
    [kodeBrowse, debouncedSearch, limit, userMode, parentFilters]
  )

  const query = useQuery({
    queryKey: browseKeys.search(params),
    queryFn: () => browseService.search(params),
    enabled: !!kodeBrowse && hasSearched,
    placeholderData: (prev) => prev, // Keep previous results while typing
    staleTime: 30 * 1000,
  })

  return {
    options: (query.data ?? []) as IBrowseRow[],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    onSearchChange: setSearchInput,
    hasSearched,
  }
}