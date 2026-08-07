/**
 * SignaturesBlock — TASK-027b AC3.2.
 *
 * Renders signature blocks for the report footer.
 * Shows the title (if configured) and the label below the signature line.
 *
 * Position: left / center / right (default center)
 * Title: shows at the top, above the line
 * Label: shows below the line
 */
import { Show } from '@/shared/ui/layout'

export interface SignatureDef {
  label: string
  position?: 'left' | 'center' | 'right'
  title?: string
}

interface SignaturesBlockProps {
  signatures: SignatureDef[]
}

export function SignaturesBlock({ signatures }: SignaturesBlockProps) {
  if (!signatures || signatures.length === 0) return null

  return (
    <div className="flex gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 w-full">
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
