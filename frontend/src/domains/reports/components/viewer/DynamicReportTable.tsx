import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/shared/ui'
import { useFormatColumn } from '../../hooks/useReport'
import { Each, Show } from '@/shared/ui/layout'
import { Loader2 } from 'lucide-react'

interface DynamicReportTableProps {
  kodeMenu: string
  columns: import('../../types').IReportColumn[]
  data: any[] | null
  isLoading: boolean
  hideBorders?: boolean
}

export function DynamicReportTable({ columns, data, isLoading, hideBorders }: DynamicReportTableProps) {
  const formatColumn = useFormatColumn()
  
  if (columns.length === 0) return null

  const tableContent = (
    <div className="overflow-x-auto w-full">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <TableRow className="border-0 hover:bg-transparent dark:hover:bg-transparent">
            <Each of={columns}>
              {(col) => (
                <TableHead 
                  key={col.nama_kolom} 
                  className={`text-slate-600 dark:text-slate-300 ${col.alignment === 'right' ? 'text-right' : col.alignment === 'center' ? 'text-center' : 'text-left'}`}
                >
                  {col.label_tampil || col.nama_kolom}
                </TableHead>
              )}
            </Each>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Show when={isLoading}>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                  <p>Memuat data...</p>
                </div>
              </TableCell>
            </TableRow>
          </Show>
          
          <Show when={!isLoading && !data}>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500">
                Silakan isi parameter dan klik Generate Report.
              </TableCell>
            </TableRow>
          </Show>
          
          <Show when={!isLoading && data && data.length === 0}>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500">
                Data tidak ditemukan untuk parameter yang dipilih.
              </TableCell>
            </TableRow>
          </Show>
          
          <Show when={!isLoading && data && data.length > 0}>
            <Each of={data || []}>
              {(row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <Each of={columns}>
                    {(col) => {
                      const cellValue = row[col.nama_kolom]
                      const formattedValue = formatColumn(cellValue, col.format_type || 'text')
                      return (
                        <TableCell 
                          key={col.nama_kolom} 
                          className={`whitespace-nowrap ${col.alignment === 'right' ? 'text-right' : col.alignment === 'center' ? 'text-center' : 'text-left'}`}
                        >
                          {formattedValue}
                        </TableCell>
                      )
                    }}
                  </Each>
                </TableRow>
              )}
            </Each>
          </Show>
        </TableBody>
      </Table>
    </div>
  )

  if (hideBorders) {
    return tableContent
  }

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 overflow-hidden">
      {tableContent}
    </div>
  )
}
