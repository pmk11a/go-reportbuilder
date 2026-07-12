import type { IBrowseRow } from "@/domains/browse/types/browse";
import { GenericBrowsePicker } from "./GenericBrowsePicker";

export type KasBankTipe = "KAS" | "BANK" | "ALL";

interface Props {
	/** Currently selected Kas/Bank code */
	value?: string;
	/** Called with new Kas/Bank code */
	onChange: (value: string) => void;
	/** Placeholder text */
	placeholder?: string;
	/** Disabled state */
	disabled?: boolean;
	/** Optional className */
	className?: string;
	/**
	 * Kas/Bank filter type:
	 * - "KAS"  → only Kas accounts (passes NoKira1=KAS to browse 20011)
	 * - "BANK" → only Bank accounts (passes NoKira1=BANK)
	 * - "ALL"  → both (NoKira1 unset; query returns empty Kode='*' which still
	 *            filters by Tipe=1 + JOIN dbPostHutPiut). Fall back to searching
	 *            all dbPerkiraan Tipe=1 when nothing is configured.
	 *
	 * Mirrors the legacy Delphi pattern:
	 *   if Mode='BKK' or 'BKM' then NoKira1:='KAS' else NoKira1:='BANK';
	 */
	kasType?: KasBankTipe;
}

/**
 * Kas/Bank picker — wrapper around GenericBrowsePicker bound to browse 20011.
 *
 * The browse 20011 query is:
 *
 *   Select Perkiraan, Keterangan, Simbol
 *   from dbPerkiraan
 *   where Tipe=1
 *     and Perkiraan in (
 *       select Perkiraan from dbPostHutPiut where Kode = '<P:NoKira1>'
 *     )
 *     and (
 *       Perkiraan like '%' + EditFilter.Text + '%'
 *       or Keterangan like '%' + EditFilter.Text + '%'
 *     )
 *
 * The `<P:NoKira1>` parent-filter placeholder is populated from
 * `parentFilters.NoKira1` in the URL (`?parent_NoKira1=KAS`). The
 * `EditFilter.Text` portion is substituted by `searchQueryBased()` with the
 * user's typed `q` value.
 *
 * Renders labels as "KODE - NAMA" with KETERANGAN as a parenthetical
 * suffix when available.
 *
 * @example
 * ```tsx
 * // All Kas/Bank (no filter)
 * <KasBankSelect
 *   value={header.kodeKas}
 *   onChange={(v) => setHeader({ ...header, kodeKas: v })}
 * />
 *
 * // Filter only Bank (for BBM/BBK transactions)
 * <KasBankSelect
 *   kasType="BANK"
 *   value={header.kodeKas}
 *   onChange={(v) => setHeader({ ...header, kodeKas: v })}
 * />
 * ```
 */
export function KasBankSelect({
	value,
	onChange,
	placeholder = "Pilih Kas / Bank...",
	disabled,
	className,
	kasType = "ALL",
}: Props) {
	const renderLabel = (row: IBrowseRow): string => {
		const kode = String(row.Per ?? row.KODE ?? "");
		const nama = String(row.Keterangan ?? row.NAMA ?? "");
		const sim = row.Simbol ? String(row.Simbol) : "";
		const base = kode && nama ? `${kode} - ${nama}` : nama || kode;
		return sim ? `${base} (${sim})` : base;
	};

	// Map kasType → browse code + parent filter.
	//
	//   KAS  → browse 20011 with NoKira1=KAS   (Kas only)
	//   BANK → browse 20011 with NoKira1=BANK  (Bank only)
	//   ALL  → browse 1005  (no parent filter; all Tipe=1 Perkiraan)
	//
	// Browse 1005 (hardcoded fallback) is preferable here because:
	//   (a) browse 20011's <P:NoKira1> placeholder is mandatory
	//       (an empty Kode='' would match no rows),
	//   (b) when the caller wants "Kas + Bank" they really want
	//       "any Perkiraan with Tipe=1" anyway.
	const browseSpec = (() => {
		if (kasType === "KAS") {
			return { kodeBrowse: "20011", parentFilters: { NoKira1: "KAS" } };
		}
		if (kasType === "BANK") {
			return { kodeBrowse: "20011", parentFilters: { NoKira1: "BANK" } };
		}
		return { kodeBrowse: "1005" as const, parentFilters: undefined };
	})();

	return (
		<GenericBrowsePicker
			kodeBrowse={browseSpec.kodeBrowse}
			value={value}
			onChange={onChange}
			keyField="Perkiraan"
			labelField="Keterangan"
			renderLabel={renderLabel}
			placeholder={placeholder}
			searchPlaceholder="Cari nama atau kode kas/bank..."
			parentFilters={browseSpec.parentFilters}
			disabled={disabled}
			className={className}
		/>
	);
}
