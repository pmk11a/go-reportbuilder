import { Each, Show } from '@/shared/ui/layout'

interface SummaryLayoutProps {
  datasetName: string
  deskripsi: string
  configJson: any
  columns: any[]
  data: any[]
  position: 'header' | 'footer'
}

export function SummaryLayout({ deskripsi, configJson, columns, data, position }: SummaryLayoutProps) {
  if (!data || data.length === 0) return null

  const rowData = data[0] // Summary datasets usually return a single row
  const layoutType = configJson?.summary_layout || 'grid_2col'
  const isFooterOnly = layoutType === 'footer_only'

  // If config says footer_only, it means the summary data is only used for the ReportFooterBands
  // (like the signature and complex footer table), so we don't render the basic grid at all.
  if (isFooterOnly) return null

  // If this component is placed as header but config wants it in footer, skip render
  // (Though currently we just use footer_only to hide it completely, leaving this for future 'footer_grid' type)
  if (position === 'footer') return null // For now, all basic grids are rendered as header, unless explicitly defined otherwise

  // Determine left and right fields
  const allFields = columns.map(c => c.nama_kolom)
  let leftFields = configJson?.summary_fields || []
  let rightFields = configJson?.right_fields || []

  // Fallback if not configured
  if (leftFields.length === 0 && rightFields.length === 0) {
    if (layoutType === 'grid_2col') {
      const half = Math.ceil(allFields.length / 2)
      leftFields = allFields.slice(0, half)
      rightFields = allFields.slice(half)
    } else {
      leftFields = allFields
    }
  }

  const formatValue = (val: any) => {
    if (typeof val === 'number') return new Intl.NumberFormat('id-ID').format(val)
    return val
  }

  const renderFieldNode = (fieldName: string) => {
    const colDef = columns.find(c => c.nama_kolom === fieldName)
    const label = colDef?.label_tampil || fieldName
    const value = rowData[fieldName]
    
    return (
      <div key={fieldName} className="flex flex-col py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-base font-medium text-slate-800 dark:text-slate-200 mt-1">
          {formatValue(value)}
        </span>
      </div>
    )
  }

  return (
    <div className="mb-6 bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 p-6">
      <Show when={deskripsi}>
        <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">{deskripsi}</h3>
      </Show>
      
      <Show when={layoutType === 'grid_2col'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Each of={leftFields as string[]}>
              {(fieldName) => renderFieldNode(fieldName)}
            </Each>
          </div>
          <div>
            <Each of={rightFields as string[]}>
              {(fieldName) => renderFieldNode(fieldName)}
            </Each>
          </div>
        </div>
      </Show>

      <Show when={layoutType !== 'grid_2col'}>
        <div className="grid grid-cols-1 gap-0">
          <Each of={leftFields as string[]}>
            {(fieldName) => renderFieldNode(fieldName)}
          </Each>
        </div>
      </Show>
    </div>
  )
}
