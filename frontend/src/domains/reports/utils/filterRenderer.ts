/**
 * Filter Renderer dispatch — TASK-027a AC2.
 *
 * Resolves the correct React component + props for each tipe_input value.
 *
 * The DynamicFilterPanel calls resolveFilterConfig() to obtain a render
 * contract for each filter (8 supported tipe_input):
 *
 *   - date          → <input type="date">
 *   - text          → <input type="text">
 *   - number        → <input type="number">
 *   - browse        → <GenericBrowsePicker>  (lookup with browse)
 *   - dropdown      → <Select>               (with konfigurasi.options)
 *   - checkbox      → <Checkbox>             (single boolean toggle)
 *   - combobox      → <GenericBrowsePicker>  (with konfigurasi.kode_browse)
 *   - perkiraan     → <GenericBrowsePicker>  (kode_browse=1001 fixed)
 *
 * Each returned contract includes:
 *   - kind: which React component family to use
 *   - normalized options / kode_browse / multi / etc.
 *   - validation warnings (non-fatal — printed once via console.warn)
 *
 * No business logic in this file — it ONLY dispatches.
 */

import type { IReportFilter } from '../types'
import { validateFilterKonfigurasi } from './filterConfigSchema'

export type ResolvedFilterKind =
  | 'date'
  | 'text'
  | 'number'
  | 'dropdown'
  | 'checkbox'
  | 'browse'
  | 'combobox'
  | 'perkiraan'

export interface ResolvedFilterConfig {
  /** Which render kind to use */
  kind: ResolvedFilterKind
  /** Dropdown/checkbox options (for kind=dropdown/checkbox) */
  options?: string[]
  /** Optional human-readable labels (parallel to options[]) */
  labelMap?: Record<string, string>
  /** Browse code for browse/combobox/perkiraan */
  kodeBrowse?: string
  /** Allow multi-select (kind=combobox only) */
  multi?: boolean
  /** Non-fatal validation warnings (printed once on resolve) */
  warnings: string[]
}

/**
 * Default browse code for perkiraan (account lookup) — kept here for
 * forward-compatibility; the FrmReportPreview.pas convention is 1001.
 */
const PERKIRAAN_KODE_BROWSE = '1001'

/**
 * Resolve render config for a single filter.
 * Returns a contract the DynamicFilterPanel can apply.
 */
export function resolveFilterConfig(filter: IReportFilter): ResolvedFilterConfig {
  const warnings: string[] = []
  const konfigurasi = filter.konfigurasi || {}

  // Validate the konfigurasi shape (relaxed — warns, does not throw)
  const issues = validateFilterKonfigurasi(filter.tipe_input, konfigurasi)
  warnings.push(...issues)

  switch (filter.tipe_input) {
    case 'date':
      return { kind: 'date', warnings }
    case 'text':
      return { kind: 'text', warnings }
    case 'number':
      return { kind: 'number', warnings }
    case 'browse': {
      const kodeBrowse = konfigurasi.kode_browse
      if (!kodeBrowse) {
        warnings.push(`filter "${filter.nama_filter}" is browse but has no konfigurasi.kode_browse — falling back to text input`)
        return { kind: 'text', warnings }
      }
      return { kind: 'browse', kodeBrowse, warnings }
    }
    case 'dropdown': {
      const options = konfigurasi.options
      if (!options || options.length === 0) {
        warnings.push(`filter "${filter.nama_filter}" is dropdown but has no konfigurasi.options — falling back to text input`)
        return { kind: 'text', warnings }
      }
      return {
        kind: 'dropdown',
        options,
        labelMap: konfigurasi.label_map,
        warnings,
      }
    }
    case 'checkbox': {
      // Checkbox is a single boolean toggle; the underlying value is "1"/"0".
      // If options is provided, we render the first value as "checked" state.
      const options = konfigurasi.options ?? ['1', '0']
      return {
        kind: 'checkbox',
        options,
        labelMap: konfigurasi.label_map,
        warnings,
      }
    }
    case 'combobox': {
      const kodeBrowse = konfigurasi.kode_browse
      if (!kodeBrowse) {
        warnings.push(`filter "${filter.nama_filter}" is combobox but has no konfigurasi.kode_browse — falling back to text input`)
        return { kind: 'text', warnings }
      }
      return {
        kind: 'combobox',
        kodeBrowse,
        multi: konfigurasi.multi ?? false,
        warnings,
      }
    }
    case 'perkiraan': {
      // Perkiraan filter — always uses the global account browse (kode_browse=1001)
      // unless explicitly overridden.
      const kodeBrowse = konfigurasi.kode_browse || PERKIRAAN_KODE_BROWSE
      return {
        kind: 'perkiraan',
        kodeBrowse,
        multi: konfigurasi.multi ?? false,
        warnings,
      }
    }
    default:
      warnings.push(`filter "${filter.nama_filter}" has unknown tipe_input="${filter.tipe_input}" — falling back to text input`)
      return { kind: 'text', warnings }
  }
}

/**
 * Sort filters by posisi ASC, stable (preserves original order for equal posisi).
 * The original TASK-027 audit found that filter ordering was DB-driven, not
 * posisi-driven — this enforces the order Delphi UI uses.
 */
export function sortFiltersByPosisi<T extends { posisi: number }>(filters: T[]): T[] {
  return [...filters].sort((a, b) => a.posisi - b.posisi)
}

/**
 * Resolve initial filter values from a filter set.
 * Honors nilai_default for every filter.
 * Returns a fresh object.
 */
export function resolveInitialFilterValues(
  filters: IReportFilter[],
  existing: Record<string, string | string[] | null> = {}
): Record<string, string | string[] | null> {
  const out: Record<string, string | string[] | null> = { ...existing }
  for (const f of filters) {
    if (out[f.nama_filter] !== undefined && out[f.nama_filter] !== null && out[f.nama_filter] !== '') {
      continue
    }
    if (f.nilai_default !== null && f.nilai_default !== undefined) {
      out[f.nama_filter] = f.nilai_default
    }
  }
  return out
}
