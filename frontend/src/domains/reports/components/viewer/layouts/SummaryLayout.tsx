import React from 'react'

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

  // If this component is placed as header but config says footer_only, skip render
  if (position === 'header' && isFooterOnly) return null
  // If placed as footer but config is not footer_only, skip render (it's already in header)
  if (position === 'footer' && !isFooterOnly) return null

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

  const renderField = (fieldName: string) => {
    const colDef = columns.find(c => c.nama_kolom === fieldName)
    const label = colDef?.label_tampil || fieldName
    const value = rowData[fieldName]
    
    return (
      <div key={fieldName} className="flex flex-col py-2 border-b border-secondary-100 dark:border-slate-800 last:border-0">
        <span className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">{label}</span>
        <span className="text-base font-medium text-secondary-900 dark:text-slate-200 mt-1">
          {formatValue(value)}
        </span>
      </div>
    )
  }

  return (
    <div className="mb-6 bg-white dark:bg-[#0f172a] rounded-xl border border-secondary-200 dark:border-white/5 shadow-sm p-5">
      {deskripsi && <h3 className="text-lg font-bold mb-4 text-secondary-800 dark:text-slate-200">{deskripsi}</h3>}
      
      {layoutType === 'grid_2col' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>{leftFields.map(renderField)}</div>
          <div>{rightFields.map(renderField)}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-0">
          {leftFields.map(renderField)}
        </div>
      )}
    </div>
  )
}
