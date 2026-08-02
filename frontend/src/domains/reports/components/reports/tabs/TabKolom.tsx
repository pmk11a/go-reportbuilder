import { useState } from 'react'
import { Plus, Settings, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui'
import { Badge } from '@/shared/ui/overlay/badge'
import { Show } from '@/shared/ui/layout/Render'
import type { IReportConfig, IReportColumn } from '@/domains/reports/types'
import { useReportMutations } from '@/domains/reports/hooks/useReportMutations'
import { useToast } from '@/shared/hooks/use-toast'
import { ColumnFormModal } from '../modals/ColumnFormModal'

export function TabKolom({ report, isDark }: { report: IReportConfig; isDark: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<IReportColumn | null>(null)
  
  const { deleteColumn } = useReportMutations(report.id_laporan)
  const { toast } = useToast()

  const cardClass = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
  const mutedClass = isDark ? 'text-slate-500' : 'text-slate-400'
  
  const columnsList = Object.values(report.columns || {}).flat()

  const handleAdd = () => {
    setSelectedColumn(null)
    setIsModalOpen(true)
  }

  const handleEdit = (column: IReportColumn) => {
    setSelectedColumn(column)
    setIsModalOpen(true)
  }

  const handleDelete = (column: IReportColumn) => {
    if (confirm(`Hapus kolom ${column.nama_kolom}?`)) {
      deleteColumn.mutate(column.id_kolom, {
        onSuccess: () => toast({ title: 'Kolom dihapus', variant: 'success' }),
      })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Konfigurasi Kolom ({columnsList.length})
        </h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Kolom
        </Button>
      </div>

      <Show
        when={columnsList.length > 0}
        fallback={<p className={`text-sm ${mutedClass}`}>Belum ada kolom dikonfigurasi.</p>}
      >
        <div className={`rounded-xl border overflow-hidden ${cardClass.replace(' bg-slate-50', '').replace(' bg-slate-800/50', '')}`}>
          <table className="w-full text-sm">
            <thead className={isDark ? 'bg-slate-800' : 'bg-slate-100'}>
              <tr>
                <th className="p-3 text-left font-medium">Kolom</th>
                <th className="p-3 text-left font-medium">Label</th>
                <th className="p-3 text-left font-medium">Format</th>
                <th className="p-3 text-left font-medium">Align</th>
                <th className="p-3 text-center font-medium">Sum</th>
                <th className="p-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {columnsList.map((col) => (
                <tr key={col.id_kolom} className="group">
                  <td className="p-3 font-mono text-xs">{col.nama_kolom}</td>
                  <td className="p-3">{col.label_tampil || col.nama_kolom}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">{col.format_type}</Badge>
                  </td>
                  <td className="p-3 capitalize">{col.alignment}</td>
                  <td className="p-3 text-center">{col.is_summable ? '✓' : '—'}</td>
                  <td className="p-3 text-right">
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(col)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(col)} loading={deleteColumn.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Show>

      <ColumnFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportId={report.id_laporan}
        column={selectedColumn}
      />
    </div>
  )
}
