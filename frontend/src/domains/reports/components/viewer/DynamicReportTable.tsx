import { Card, CardContent } from '@/shared/ui'
import { useReportConfig, useFormatColumn } from '../../hooks/useReport'

interface DynamicReportTableProps {
  kodeMenu: string
  columns: import('../../types').IReportColumn[]
  data: any[] | null
  isLoading: boolean
  hideBorders?: boolean
}

export function DynamicReportTable({ kodeMenu, columns, data, isLoading, hideBorders }: DynamicReportTableProps) {
  const formatColumn = useFormatColumn()
  
  if (columns.length === 0) return null

  const tableContent = (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left">
        <thead className="bg-secondary-50 dark:bg-slate-800/50 text-secondary-600 dark:text-slate-300 border-b border-secondary-200 dark:border-white/10">
          <tr>
              {columns.map((col) => (
                <th 
                  key={col.nama_kolom} 
                  className={`px-4 py-3 font-medium ${col.alignment === 'right' ? 'text-right' : col.alignment === 'center' ? 'text-center' : 'text-left'}`}
                >
                  {col.label_tampil || col.nama_kolom}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100 dark:divide-white/5 bg-white dark:bg-transparent">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-secondary-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <p>Memuat data...</p>
                  </div>
                </td>
              </tr>
            ) : !data ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-secondary-500">
                  Silakan isi parameter dan klik Generate Report.
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-secondary-500">
                  Data tidak ditemukan untuk parameter yang dipilih.
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-secondary-50/50 transition-colors">
                  {columns.map((col) => {
                    const cellValue = row[col.nama_kolom]
                    const formattedValue = formatColumn(cellValue, col.format_type || 'text')
                    return (
                      <td 
                        key={col.nama_kolom} 
                        className={`px-4 py-3 whitespace-nowrap ${col.alignment === 'right' ? 'text-right' : col.alignment === 'center' ? 'text-center' : 'text-left'}`}
                      >
                        {formattedValue}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
    </div>
  )

  if (hideBorders) {
    return tableContent
  }

  return (
    <Card className="shadow-sm border-secondary-200 dark:border-white/10 dark:bg-[#0f172a]">
      <CardContent className="p-0">
        {tableContent}
      </CardContent>
    </Card>
  )
}
