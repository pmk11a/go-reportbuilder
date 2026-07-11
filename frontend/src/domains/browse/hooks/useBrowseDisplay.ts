import { useBrowseValidate } from '@/domains/browse/hooks/useBrowse'
import { pickField } from '@/domains/browse/types/browse'

interface UseBrowseDisplayOptions {
  kodeBrowse: string
  code: string
  /** Which field to use for the display string (defaults to labelField from type meta, then 'Nama') */
  labelField?: string
}

/**
 * Convenience hook: returns a human-readable label for a code, or the
 * code itself while loading or if the code is not found.
 *
 * Used in detail views and tables where you need to show "Kode - Keterangan"
 * (e.g. badge in a transaction list) without re-fetching via the search
 * endpoint.
 *
 * @example
 * ```tsx
 * const { label, isLoading } = useBrowseDisplay({
 *   kodeBrowse: '1001',
 *   code: '1101101',
 * })
 * return <span>{label}</span>
 * ```
 */
export function useBrowseDisplay(opts: UseBrowseDisplayOptions): {
  label: string
  isLoading: boolean
  error: Error | null
} {
  const { kodeBrowse, code, labelField = 'Nama' } = opts
  const { data, isLoading, error } = useBrowseValidate(kodeBrowse, code)

  if (isLoading) {
    return { label: code, isLoading: true, error: error as Error | null }
  }
  if (!data) {
    return { label: code, isLoading: false, error: error as Error | null }
  }
  const field = pickField(data, labelField) ?? pickField(data, 'Keterangan')
  const keyValue = pickField(data, 'Kode') ?? pickField(data, 'KODECUSTSUPP') ?? pickField(data, 'KODE')
  const displayValue = field ?? keyValue ?? code
  const label = keyValue && field ? `${keyValue} - ${displayValue}` : String(displayValue)

  return { label, isLoading: false, error: error as Error | null }
}
