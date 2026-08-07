/**
 * PageFooterBand — TASK-027b AC3.3.
 *
 * Renders the footer band from footer_bands config.
 *
 * The footer band definition (from JSON) has this shape:
 *   bands.footer = {
 *     enabled: true,
 *     content: "Halaman {{page}} dari {{total}} | Generated: {{date}}",
 *     align: 'center',
 *     style: { fontSize: 'small', color: 'slate-500' },
 *   }
 *
 * Dynamic placeholders are substituted at render time:
 *   - {{page}}    → current page number (1-indexed)
 *   - {{total}}   → total page count
 *   - {{date}}    → formatted current date (ID locale, DD/MM/YYYY)
 *   - {{report}}  → report name
 *
 * Static text is rendered as-is.
 */
import { useMemo } from 'react'

interface PageFooterBandProps {
  footerBandConfig?: Record<string, any> | null
  currentPage?: number
  totalPages?: number
  reportName?: string
}

const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g

export function PageFooterBand({
  footerBandConfig,
  currentPage = 1,
  totalPages = 1,
  reportName = 'Laporan',
}: PageFooterBandProps) {
  const content = footerBandConfig?.content || ''
  const align = footerBandConfig?.align || 'center'
  const style = footerBandConfig?.style || {}

  // Substitute dynamic placeholders
  const text = useMemo(() => {
    if (!content) return ''
    const now = new Date()
    const dateStr = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const context: Record<string, string> = {
      page: String(currentPage),
      total: String(totalPages),
      date: dateStr,
      report: reportName,
    }
    return content.replace(PLACEHOLDER_REGEX, (_match: string, key: string) => context[key] ?? _match)
  }, [content, currentPage, totalPages, reportName])

  if (!text) return null

  const sizeClass = (style.fontSize as string) === 'small'
    ? 'text-xs'
    : (style.fontSize as string) === 'large'
    ? 'text-base'
    : 'text-sm'

  const colorMap: Record<string, string> = {
    'slate-500': 'text-slate-500 dark:text-slate-400',
    'slate-600': 'text-slate-600 dark:text-slate-300',
    'slate-700': 'text-slate-700 dark:text-slate-200',
  }

  const colorClass = colorMap[style.color] || 'text-slate-500 dark:text-slate-400'
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'

  return (
    <div className={`mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50 ${alignClass}`}>
      <p className={`${sizeClass} ${colorClass}`}>{text}</p>
    </div>
  )
}
