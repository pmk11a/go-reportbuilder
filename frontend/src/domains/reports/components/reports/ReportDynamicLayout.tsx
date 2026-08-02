// import {} from 'react'
import { useFormatColumn } from '../../hooks/useReport'
import type { IReportExecutionResult, IReportComponent } from '../../types'

interface ReportDynamicLayoutProps {
  result: IReportExecutionResult
  isLoading?: boolean
}

export function ReportDynamicLayout({ result, isLoading }: ReportDynamicLayoutProps) {
  const formatColumn = useFormatColumn()
  const { config, datasets } = result
  const komponenList = config.komponen || []
  const footerBands = config.footer_bands?.bands

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/3"></div>
      <div className="h-64 bg-muted rounded w-full"></div>
    </div>
  }

  // Find active components
  const activeKomponen = komponenList.filter(k => k.is_active !== false).sort((a, b) => a.urutan - b.urutan)

  // Title / Header
  const renderHeader = () => {
    if (!footerBands?.title?.enabled && !footerBands?.pageHeader?.enabled) return null
    return (
      <div className="mb-6 text-center space-y-2">
        {footerBands?.title?.enabled && (
          <h1 className="text-xl font-bold uppercase tracking-wider">
            {footerBands.title.content}
          </h1>
        )}
        {footerBands?.pageHeader?.enabled && (
          <h2 className="text-sm font-medium text-muted-foreground">
            {footerBands.pageHeader.content}
          </h2>
        )}
      </div>
    )
  }

  // Footer Signatures
  const renderSignatures = () => {
    if (!footerBands?.summary?.enabled || !footerBands?.summary?.signatures) return null
    const signatures = footerBands.summary.signatures
    const columns = footerBands.summary.layout?.columns || signatures.length
    
    return (
      <div className="mt-16 page-break-inside-avoid">
        <div 
          className="grid gap-4 w-full"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {signatures.map((sig: any, idx: number) => (
            <div key={idx} className="flex flex-col items-center justify-between min-h-[120px]">
              <div className="text-sm font-medium">{sig.label}</div>
              <div className="w-40 border-b border-black"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Table Renderer
  const renderComponent = (comp: IReportComponent) => {
    const layoutConfig = comp.konfigurasi_layout
    const dataBindings = layoutConfig.dataBinding || []
    
    // Check if side-by-side layout
    if (layoutConfig.style?.layout === 'side_by_side') {
      return renderSideBySideTable(comp, datasets, dataBindings, layoutConfig, formatColumn)
    }

    return renderStandardTable(comp, datasets, dataBindings, layoutConfig, formatColumn, config.columns)
  }

  return (
    <div className="bg-white text-black p-8 rounded-lg shadow-sm print:shadow-none print:p-0 w-full" id="printable-report">
      {renderHeader()}

      <div className="space-y-8">
        {activeKomponen.length > 0 ? (
          activeKomponen.map(comp => (
            <div key={comp.id_komponen} className="overflow-x-auto w-full">
              {renderComponent(comp)}
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Component layout is not defined. Please define a component to view the report.
          </div>
        )}
      </div>

      {renderSignatures()}
    </div>
  )
}

function renderStandardTable(
  _comp: IReportComponent, 
  datasets: Record<string, any[]>, 
  dataBindings: any[], 
  layoutConfig: any,
  formatColumn: any,
  allColumnsConfig: any
) {
  // Find the primary dataset source
  const sourceName = dataBindings[0]?.source
  const data = datasets[sourceName] || []
  
  // Find column configurations for alignments and formats
  const colConfigs = allColumnsConfig[sourceName] || []
  
  const getColFormat = (field: string) => {
    return colConfigs.find((c: any) => c.nama_kolom === field)?.format_type || 'text'
  }
  const getColAlign = (field: string) => {
    const align = colConfigs.find((c: any) => c.nama_kolom === field)?.alignment || 'left'
    return align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  }

  return (
    <table className={`w-full border-collapse text-sm ${layoutConfig.style?.tailwindClasses || ''}`}>
      <thead className={layoutConfig.style?.headerStyle || 'bg-gray-100 font-bold'}>
        <tr>
          {dataBindings.map((bind, idx) => (
            <th key={idx} className="border border-gray-300 px-3 py-2 uppercase text-left">
              {bind.display.replace(/_/g, ' ')}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 && (
          <tr>
            <td colSpan={dataBindings.length} className="text-center py-4 border border-gray-300">No data</td>
          </tr>
        )}
        {data.map((row, rIdx) => (
          <tr key={rIdx} className={layoutConfig.style?.rowStyle || 'odd:bg-white even:bg-gray-50'}>
            {dataBindings.map((bind, cIdx) => (
              <td key={cIdx} className={`border border-gray-300 px-3 py-2 ${getColAlign(bind.field)}`}>
                {formatColumn(row[bind.field], getColFormat(bind.field))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function renderSideBySideTable(
  _comp: IReportComponent, 
  datasets: Record<string, any[]>, 
  dataBindings: any[], 
  layoutConfig: any,
  formatColumn: any
) {
  // Usually groups bindings by source. E.g. QuView3 (Left) and QuView4 (Right)
  const sources = Array.from(new Set(dataBindings.map(b => b.source)))
  
  if (sources.length !== 2) {
    return <div>Invalid side-by-side configuration</div>
  }

  const leftSource = sources[0]
  const rightSource = sources[1]
  
  const leftData = datasets[leftSource] || []
  const rightData = datasets[rightSource] || []
  
  const maxRows = Math.max(leftData.length, rightData.length)
  
  const leftBindings = dataBindings.filter(b => b.source === leftSource)
  const rightBindings = dataBindings.filter(b => b.source === rightSource)

  return (
    <table className={`w-full border-collapse text-sm ${layoutConfig.style?.tailwindClasses || ''}`}>
      <thead className={layoutConfig.style?.headerStyle || 'bg-gray-100 font-bold text-center'}>
        <tr>
          <th colSpan={leftBindings.length} className="border border-gray-300 px-3 py-2 uppercase">AKTIVA</th>
          <th colSpan={rightBindings.length} className="border border-gray-300 px-3 py-2 uppercase">PASIVA</th>
        </tr>
        <tr>
          {leftBindings.map((bind, idx) => (
             <th key={`l-${idx}`} className="border border-gray-300 px-3 py-2 bg-gray-50">
               {bind.display.replace(/_/g, ' ')}
             </th>
          ))}
          {rightBindings.map((bind, idx) => (
             <th key={`r-${idx}`} className="border border-gray-300 px-3 py-2 bg-gray-50">
               {bind.display.replace(/_/g, ' ')}
             </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: maxRows }).map((_, rIdx) => {
          const lRow = leftData[rIdx] || {}
          const rRow = rightData[rIdx] || {}
          
          return (
            <tr key={rIdx} className={layoutConfig.style?.rowStyle || 'odd:bg-white even:bg-gray-50'}>
              {leftBindings.map((bind, cIdx) => (
                <td key={`ld-${cIdx}`} className={`border border-gray-300 px-3 py-1 ${typeof lRow[bind.field] === 'number' ? 'text-right' : 'text-left'}`}>
                  {lRow[bind.field] !== undefined ? formatColumn(lRow[bind.field], typeof lRow[bind.field] === 'number' ? 'currency' : 'text') : ''}
                </td>
              ))}
              {rightBindings.map((bind, cIdx) => (
                <td key={`rd-${cIdx}`} className={`border border-gray-300 px-3 py-1 ${typeof rRow[bind.field] === 'number' ? 'text-right' : 'text-left'}`}>
                  {rRow[bind.field] !== undefined ? formatColumn(rRow[bind.field], typeof rRow[bind.field] === 'number' ? 'currency' : 'text') : ''}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
