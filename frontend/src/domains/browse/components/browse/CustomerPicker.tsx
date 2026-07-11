import { GenericBrowsePicker } from './GenericBrowsePicker'
import type { IBrowseRow } from '@/domains/browse/types/browse'

interface Props {
  /** Currently selected customer/supplier code */
  value?: string
  /** Called with new customer/supplier code */
  onChange: (value: string) => void
  /** Customer or supplier type (1 = Customer, 2 = Supplier, etc.) */
  jenis?: number
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Optional className */
  className?: string
}

/**
 * Customer/Supplier picker — wrapper around GenericBrowsePicker.
 *
 * Renders labels as "KODECUSTSUPP - NAMACUSTSUPP" with Kota as a
 * parenthetical suffix when available, for a compact two-tier display.
 *
 * @example
 * ```tsx
 * <CustomerPicker
 *   value={header.kodeCust}
 *   onChange={(v) => setHeader({ ...header, kodeCust: v })}
 *   jenis={1}
 * />
 * ```
 */
export function CustomerPicker({
  value,
  onChange,
  jenis,
  placeholder = 'Pilih Customer / Supplier...',
  disabled,
  className,
}: Props) {
  const parentFilters: Record<string, string | number> = {}
  if (jenis != null) parentFilters.jenis = jenis

  const renderLabel = (row: IBrowseRow): string => {
    const kode = String(row.KODECUSTSUPP ?? '')
    const nama = String(row.NAMACUSTSUPP ?? '')
    const kota = row.Kota ? String(row.Kota) : ''
    const base = kode && nama ? `${kode} - ${nama}` : nama || kode
    return kota ? `${base} (${kota})` : base
  }

  return (
    <GenericBrowsePicker
      kodeBrowse="1009"
      value={value}
      onChange={onChange}
      parentFilters={Object.keys(parentFilters).length > 0 ? parentFilters : undefined}
      keyField="KODECUSTSUPP"
      labelField="NAMACUSTSUPP"
      renderLabel={renderLabel}
      placeholder={placeholder}
      searchPlaceholder="Cari nama atau kode customer..."
      disabled={disabled}
      className={className}
    />
  )
}