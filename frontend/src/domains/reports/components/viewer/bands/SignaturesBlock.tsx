/**
 * SignaturesBlock — TASK-030 Step 5.
 *
 * Renders signature blocks for the report footer.
 * Shows the title (if configured) and the label below the signature line.
 *
 * Position: left / center / right (default center)
 * Title: shows at the top, above the line
 * Label: shows below the line
 *
 * Note: border-top is NOT included here — the parent (ReportFooterBands)
 * controls spacing and border when the block is embedded in the footer section.
 */
import { Show } from '@/shared/ui/layout'

export interface SignatureDef {
  label: string
  position?: 'left' | 'center' | 'right'
  title?: string
}

interface SignaturesBlockProps {
  signatures: SignatureDef[]
  /** When true, adds border-top + pt-6; use when rendering standalone */
  withBorder?: boolean
}

export function SignaturesBlock({ signatures, withBorder = false }: SignaturesBlockProps) {
  if (!signatures || signatures.length === 0) return null

  return (
    <div className={`flex gap-4 w-full ${withBorder ? 'mt-8 pt-6 border-t border-slate-200 dark:border-slate-700' : 'mt-8'}`}>
      {signatures.map((sig, idx) => (
        <div
          key={idx}
          className={`flex-1 flex flex-col ${
            sig.position === 'left' ? 'items-start' :
            sig.position === 'right' ? 'items-end' :
            'items-center'
          }`}
        >
          <Show when={!!sig.title}>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4">
              {sig.title}
            </p>
          </Show>
          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-16">
              {sig.label}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">( ........................................ )</p>
          </div>
        </div>
      ))}
    </div>
  )
}
