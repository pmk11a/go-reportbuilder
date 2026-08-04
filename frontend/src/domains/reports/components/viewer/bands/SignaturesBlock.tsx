interface SignatureDef {
  label: string
  position?: 'left' | 'center' | 'right'
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
          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-16">{sig.label}</p>
            <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">( ........................................ )</p>
          </div>
        </div>
      ))}
    </div>
  )
}
