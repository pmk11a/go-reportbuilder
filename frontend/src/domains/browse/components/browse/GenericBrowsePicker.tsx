import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/shared/ui/form/searchable-select'
import { useBrowseSearch } from '@/domains/browse/hooks/useBrowseSearch'
import {
  useBrowseTypes,
  useBrowseValidate,
  useBrowsePaged,
  browseKeys,
} from '@/domains/browse/hooks/useBrowse'
import type { IBrowseRow } from '@/domains/browse/types/browse'

export interface GenericBrowsePickerProps {
  /** kodeBrowse identifier, e.g. "1001" for Perkiraan */
  kodeBrowse: string
  /** Currently selected value (the code) */
  value?: string | null
  /** Called when the user picks a different value */
  onChange: (value: string, row?: IBrowseRow) => void
  /** Override key field (defaults to the kodeBrowse config's keyField) */
  keyField?: string
  /** Override label field (defaults to the kodeBrowse config's labelField) */
  labelField?: string
  /** Placeholder text */
  placeholder?: string
  /** Disable the picker */
  disabled?: boolean
  /** Classname passthrough */
  className?: string
  /**
   * Parent context filters. Keys are mapped to URL params as
   * `parent_<sourceColumn>=<value>` and substituted into placeholders
   * like `<P:KODE_DIV>` in the SQL query.
   */
  parentFilters?: Record<string, string | number>
  /**
   * KodeBrowse-specific discriminator (e.g. "Y" for Kas-only on Perkiraan,
   * "Hutang"/"Piutang" on Customer/Supplier). Only honoured when
   * `usePaged` is true.
   */
  jenis?: string
  /**
   * Arbitrary extra params merged into the URL query string
   * (e.g. `{ mode: 'kas-bank', value: 'K' }`). Only used when
   * `usePaged` is true.
   */
  extraParams?: Record<string, string | number | boolean>
  /**
   * When true, the picker uses the paginated `/api/browse/paged`
   * endpoint instead of the simple `/search`. Required for pickers
   * that need infinite scroll (Kas/Bank, Customer/Supplier).
   */
  usePaged?: boolean
  /** Page size for paged mode (default 20) */
  pageSize?: number
  /** User permission mode (passed through) */
  userMode?: string
  /**
   * Custom renderer for the option label (defaults to labelField).
   * Used by KasBankSelect/CustomerPicker to compose richer labels
   * like "1101101 - BANK BRI (Y)".
   */
  renderLabel?: (row: IBrowseRow) => string
  /** Custom placeholder for the search input */
  searchPlaceholder?: string
}

/**
 * Generic browse picker — works for any registered kodeBrowse.
 *
 * Two modes:
 * - **Default (usePaged=false)**: debounced /search. Simple, best for small
 *   datasets (Perkiraan type, Departemen, etc.) where users typically
 *   type to find a row.
 * - **Paged (usePaged=true)**: paginated /paged endpoint with total/hasMore.
 *   Required for infinite-scroll pickers (Kas/Bank, Customer/Supplier).
 *
 * The picker discovers keyField/labelField automatically by calling
 * /api/browse/types and looking up the metadata for `kodeBrowse`. Manual
 * overrides via the `keyField` and `labelField` props take precedence.
 *
 * @example
 * ```tsx
 * // Default mode (debounced search)
 * <GenericBrowsePicker kodeBrowse="1001" value={x} onChange={setX} />
 *
 * // Kas/Bank picker with jenis=Y filter and infinite scroll
 * <GenericBrowsePicker
 *   kodeBrowse="1004"
 *   usePaged
 *   jenis="Y"
 *   pageSize={20}
 *   value={kodeAkun}
 *   onChange={setKodeAkun}
 * />
 *
 * // Customer/Supplier picker for Piutang
 * <GenericBrowsePicker
 *   kodeBrowse="1009"
 *   usePaged
 *   jenis="Piutang"
 *   parentFilters={{ KODE_DIV: '01' }}
 *   value={cust}
 *   onChange={setCust}
 * />
 * ```
 */
export function GenericBrowsePicker(props: GenericBrowsePickerProps) {
  const {
    kodeBrowse,
    value,
    onChange,
    keyField,
    labelField,
    placeholder,
    disabled,
    className,
    parentFilters,
    jenis,
    extraParams,
    usePaged = false,
    pageSize = 20,
    userMode,
    renderLabel,
    searchPlaceholder,
  } = props

  const { data: types } = useBrowseTypes()
  const typeMeta = useMemo(
    () => types?.find((t:any) => t.kodeBrowse === kodeBrowse),
    [types, kodeBrowse]
  )

  // Resolve effective keyField/labelField (props override metadata)
  const effKeyField = keyField ?? typeMeta?.keyField ?? 'Kode'
  const effLabelField = labelField ?? typeMeta?.labelField ?? 'Keterangan'

  // ----- Default (debounced search) mode -----
  const {
    options: searchResults,
    onSearchChange,
  } = useBrowseSearch({
    kodeBrowse,
    parentFilters,
    userMode,
    limit: 50,
    debounceMs: 300,
    minChars: 1,
  })

  // ----- Paged mode with infinite scroll -----
  const pagedQuery = useBrowsePaged(
    {
      kodeBrowse,
      jenis,
      sortBy: effLabelField,
      sortDir: 'ASC',
      limit: pageSize,
      offset: 0,
      parentFilters,
      extraParams,
      userMode,
    },
    { enabled: usePaged }
  )

  // ----- Current value's row (validated) -----
  const { data: validatedRow } = useBrowseValidate(kodeBrowse, value ?? '')

  // Find the selected row from search results or validatedRow
  const selectedRowFromResults = useMemo(() => {
    if (!value) return undefined
    const safeResults = Array.isArray(searchResults) ? searchResults : []
    // Helper inline for this useMemo
    const getFieldValue = (row: any, field: string) => {
      if (!row || !field) return ''
      if (row[field] !== undefined) return row[field]
      const foundKey = Object.keys(row).find(k => k.toLowerCase() === field.toLowerCase())
      return foundKey ? row[foundKey] : ''
    }
    // First, try to find in search results
    const found = safeResults.find(
      (r) => String(getFieldValue(r, effKeyField) ?? '') === String(value ?? '')
    )
    if (found) return found
    // Then, fall back to validatedRow
    return validatedRow ?? undefined
  }, [value, searchResults, validatedRow, effKeyField])

  // Helper to safely get case-insensitive key from object
  const getFieldValue = (row: any, field: string) => {
    if (!row || !field) return ''
    if (row[field] !== undefined) return row[field]
    const lowerField = field.toLowerCase()
    const foundKey = Object.keys(row).find(k => k.toLowerCase() === lowerField)
    return foundKey ? row[foundKey] : ''
  }

  // Build options from the active mode
  const options: SearchableSelectOption[] = useMemo(() => {
    const makeOpt = (row: IBrowseRow): SearchableSelectOption => ({
      value: String(getFieldValue(row, effKeyField) ?? ''),
      label: renderLabel
        ? renderLabel(row)
        : String(getFieldValue(row, effLabelField) ?? ''),
    })

    let items: IBrowseRow[] = []

    if (usePaged) {
      items = pagedQuery.data?.items ?? []
    } else {
      // Default: show search results; if user hasn't typed, prepend the
      // currently-selected row (by value) from search results so the
      // dropdown displays the label. Also fall back to validatedRow when
      // search results are empty but a value is selected.
      const safeResults: IBrowseRow[] = Array.isArray(searchResults)
        ? searchResults
        : []
      items = [...safeResults]
      const present = items.some(
        (r) => String(getFieldValue(r, effKeyField) ?? '') === String(value ?? '')
      )
      if (!present && value && selectedRowFromResults) {
        items.unshift(selectedRowFromResults)
      }
    }

    // Remove duplicates based on value
    const uniqueOptions = new Map<string, SearchableSelectOption>()
    items.map(makeOpt).forEach(opt => {
      if (!uniqueOptions.has(opt.value)) {
        uniqueOptions.set(opt.value, opt)
      }
    })

    return Array.from(uniqueOptions.values())
  }, [
    usePaged,
    pagedQuery.data,
    searchResults,
    value,
    selectedRowFromResults,
    effKeyField,
    effLabelField,
    renderLabel,
  ])

  // Resolve the currently-selected row (either from paged validation
  // or default-mode selectedRow) so we can capture the raw row in onChange.
  const resolvedSelectedRow = useMemo<IBrowseRow | undefined>(() => {
    if (usePaged) return (validatedRow ?? undefined) as IBrowseRow | undefined
    return selectedRowFromResults
  }, [usePaged, validatedRow, selectedRowFromResults])

  return (
    <SearchableSelect
      value={value ?? undefined}
      onValueChange={(val) => onChange(String(val), resolvedSelectedRow)}
      options={options}
      placeholder={
        placeholder ??
        `Pilih ${typeMeta?.group ?? kodeBrowse}...`
      }
      disabled={disabled}
      className={className}
      onSearchChange={usePaged ? undefined : onSearchChange}
      disableLocalSearch={true}
      searchPlaceholder={searchPlaceholder}
    />
  )
}

/**
 * Imperative cache helper: invalidate every search/paged query for a
 * given kodeBrowse. Useful after creating a master data row.
 */
export function useInvalidateBrowseFor(kodeBrowse: string) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({
      queryKey: ['browse', 'search'],
      predicate: (q) => {
        const key = q.queryKey as readonly unknown[]
        const params = key[2] as { kodeBrowse?: string } | undefined
        return params?.kodeBrowse === kodeBrowse
      },
    })
    qc.invalidateQueries({
      queryKey: ['browse', 'paged'],
      predicate: (q) => {
        const key = q.queryKey as readonly unknown[]
        const params = key[2] as { kodeBrowse?: string } | undefined
        return params?.kodeBrowse === kodeBrowse
      },
    })
    qc.invalidateQueries({ queryKey: browseKeys.types() })
  }
}
