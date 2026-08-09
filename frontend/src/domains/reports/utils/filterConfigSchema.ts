/**
 * Filter konfigurasi schema (relaxed) — TASK-027a AC2.
 *
 * This is a lightweight, hand-rolled validator (no Zod dependency) that
 * catches the common shape drift we've seen in TASK-027 audit:
 *   - dropdown without konfigurasi.options
 *   - combobox without konfigurasi.kode_browse
 *   - perkiraan without browse code
 *
 * It returns a list of human-readable warning strings. It NEVER throws —
 * the renderer falls back gracefully (e.g. dropdown ��� text input).
 *
 * For a strict Zod schema, see Zod docs; we keep this small and dependency-free
 * to match the project's "minimum code that solves the problem" guideline.
 */

import type { IFilterKonfigurasi, IFilterInputType } from '../types'

const KNOWN_INPUT_TYPES: IFilterInputType[] = [
  'date',
  'text',
  'number',
  'combobox',
  'browse',
  'perkiraan',
  'dropdown',
  'checkbox',
]

/**
 * Validate the konfigurasi JSON for a given filter tipe_input.
 * Returns a list of non-fatal warnings (empty = clean).
 */
export function validateFilterKonfigurasi(
  tipeInput: IFilterInputType,
  konfigurasi: IFilterKonfigurasi | null | undefined
): string[] {
  const warnings: string[] = []

  if (!KNOWN_INPUT_TYPES.includes(tipeInput)) {
    warnings.push(`unknown tipe_input: "${tipeInput}"`)
  }

  if (!konfigurasi) {
    // text/date/number don't need konfigurasi; dropdown/checkbox/etc do.
    if (['dropdown', 'checkbox', 'combobox', 'browse', 'perkiraan'].includes(tipeInput)) {
      warnings.push(`tipe_input "${tipeInput}" has no konfigurasi — fallback expected`)
    }
    return warnings
  }

  switch (tipeInput) {
    case 'dropdown':
      if (!konfigurasi.options || konfigurasi.options.length === 0) {
        warnings.push('dropdown filter missing konfigurasi.options')
      }
      break
    case 'checkbox':
      // checkbox may use options[] or just act as boolean; both OK
      break
    case 'combobox':
      if (!konfigurasi.kode_browse) {
        warnings.push('combobox filter missing konfigurasi.kode_browse')
      }
      break
    case 'browse':
      if (!konfigurasi.kode_browse) {
        warnings.push('browse filter missing konfigurasi.kode_browse')
      }
      break
    case 'perkiraan':
      // optional — falls back to default browse 1001
      break
    default:
      // date / text / number: no konfigurasi needed
      break
  }

  return warnings
}
