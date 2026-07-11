import { GenericBrowsePicker } from './GenericBrowsePicker'
import type { IBrowseRow } from '@/domains/browse/types/browse'

interface Props {
  /** Currently selected Kas/Bank code */
  value?: string
  /** Called with new Kas/Bank code */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Optional className */
  className?: string
}

/**
 * Kas/Bank picker — wrapper around GenericBrowsePicker.
 *
 * Renders labels as "KODE - NAMA" with KETERANGAN as a parenthetical
 * suffix when available.
 *
 * @example
 * ```tsx
 * <KasBankSelect
 *   value={header.kodeKas}
 *   onChange={(v) => setHeader({ ...header, kodeKas: v })}
 * />
 * ```
 */
export function KasBankSelect({
  value,
  onChange,
  placeholder = 'Pilih Kas / Bank...',
  disabled,
  className,
}: Props) {
  const renderLabel = (row: IBrowseRow): string => {
    const kode = String(row.KODE ?? '')
    const nama = String(row.NAMA ?? '')
    const ket = row.KETERANGAN ? String(row.KETERANGAN) : ''
    const base = kode && nama ? `${kode} - ${nama}` : nama || kode
    return ket ? `${base} (${ket})` : base
  }

  return (
    <GenericBrowsePicker
      kodeBrowse="1013"
      value={value}
      onChange={onChange}
      keyField="KODE"
      labelField="NAMA"
      renderLabel={renderLabel}
      placeholder={placeholder}
      searchPlaceholder="Cari nama atau kode kas/bank..."
      disabled={disabled}
      className={className}
    />
  )
}