import { GenericBrowsePicker } from './GenericBrowsePicker'

interface Props {
  /** Currently selected Perkiraan code */
  value?: string
  /** Called with new Perkiraan code */
  onChange: (value: string) => void
  /** Exclude certain Perkiraan codes (e.g. profit/loss accounts when needed for balance sheet) */
  without?: string
  /** Filter by PosHutPiut (default 'N' — neutral accounts) */
  posthutpiut?: string
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Optional className */
  className?: string
}

/**
 * Perkiraan (Chart of Accounts) picker — wrapper around GenericBrowsePicker.
 *
 * Drop-in replacement for the previous PerkiraanSelect. Public API is
 * preserved (value, onChange, without, posthutpiut) so existing callers
 * (kasbank forms, transaction forms, etc.) need no changes.
 *
 * Mapping:
 * - `posthutpiut` → `parentFilters.posthutpiut`
 * - `without` → `parentFilters.without` (semantic to the backend)
 *
 * @example
 * ```tsx
 * <PerkiraanSelect
 *   value={header.kodePerkiraan}
 *   onChange={(v) => setHeader({ ...header, kodePerkiraan: v })}
 *   posthutpiut="N"
 * />
 * ```
 */
export function PerkiraanSelect({
  value,
  onChange,
  without,
  posthutpiut,
  placeholder = 'Pilih Perkiraan...',
  disabled,
  className,
}: Props) {
  const parentFilters: Record<string, string | number> = {}
  if (without) parentFilters.without = without
  if (posthutpiut) parentFilters.posthutpiut = posthutpiut

  return (
    <GenericBrowsePicker
      kodeBrowse="1001"
      value={value}
      onChange={onChange}
      parentFilters={Object.keys(parentFilters).length > 0 ? parentFilters : undefined}
      keyField="Kode"
      labelField="Keterangan"
      placeholder={placeholder}
      searchPlaceholder="Cari keterangan atau kode perkiraan..."
      disabled={disabled}
      className={className}
    />
  )
}