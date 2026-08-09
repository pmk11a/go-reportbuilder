/**
 * Substitution helper — TASK-027b AC3.1 + AC3.12.
 *
 * Replaces:
 *   - @paramName   → value from filterValues (FR3 style)
 *   - [paramName]  → value from filterValues (alternative style)
 *
 * If a placeholder value is not found in filterValues, it falls back to
 * the placeholder text itself (no error).
 *
 * Example: "Invoice Periode @tgl1 s/d @tgl2" with tgl1="01/01/2024"
 *   → "Invoice Periode 01/01/2024 s/d 01/01/2024"
 */
export function substituteTemplate(
  template: string | null | undefined,
  filterValues: Record<string, string | string[] | null>
): string {
  if (!template) return ''
  // Sort replacements longest-first to avoid partial-match issues
  // e.g. "tgl2" before "tgl"
  const sorted = Object.entries(filterValues)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .sort((a, b) => b[0].length - a[0].length)

  // Process bracket-style [param] BEFORE @param to avoid partial-match issues
  // (e.g. "[@items]" must not become "[a,b]" via the @ replacement first)
  let result = template
  result = result.replace(/\[([^\]]+)\]/g, (_match, key) => {
    const v = filterValues[key]
    if (v === null || v === undefined || v === '') return _match
    return String(v)
  })

  // Then process @param style
  const escapedMap = new Map(sorted.map(([k]) => [k, k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')]))
  for (const [key, escaped] of escapedMap) {
    const value = filterValues[key]
    if (value === null || value === undefined || value === '') continue
    result = result.replace(new RegExp(`@${escaped}`, 'g'), String(value))
  }
  return result
}

/**
 * Extract font/style properties from a title config.
 * Default values match the current hardcoded styles in ReportTitleBand.
 */
export interface TitleStyleConfig {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  fontWeight: 'normal' | 'medium' | 'semibold' | 'black'
  italic: boolean
  divider: boolean
  color?: string
}

export function parseTitleStyle(titleConfig: Record<string, any>): TitleStyleConfig {
  const fontSize = titleConfig.font_size || 'large'
  const fontWeight = titleConfig.font_weight || 'black'
  const italic = !!titleConfig.italic
  const divider = !!titleConfig.divider
  const color = titleConfig.color || undefined
  return { fontSize, fontWeight, italic, divider, color }
}

/**
 * Tailwind class map for title font sizes.
 */
export const TITLE_FONT_SIZE_CLASS: Record<string, string> = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-2xl',
  xlarge: 'text-3xl',
}

/**
 * Tailwind class map for title font weights.
 */
export const TITLE_FONT_WEIGHT_CLASS: Record<string, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  black: 'font-black',
}
