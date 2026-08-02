import { useState } from 'react'
import { Plus, Settings, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui'
import { Badge } from '@/shared/ui/overlay/badge'
import { Each, Show } from '@/shared/ui/layout/Render'
import type { IReportConfig, IReportFilter } from '@/domains/reports/types'
import { useReportMutations } from '@/domains/reports/hooks/useReportMutations'
import { useToast } from '@/shared/hooks/use-toast'
import { FilterFormModal } from '../modals/FilterFormModal'

export function TabFilter({ report, isDark }: { report: IReportConfig; isDark: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<IReportFilter | null>(null)
  
  const { deleteFilter } = useReportMutations(report.id_laporan)
  const { toast } = useToast()

  const mutedClass = isDark ? 'text-slate-500' : 'text-slate-400'
  const cardClass = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
  const codeClass = isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'

  const handleAdd = () => {
    setSelectedFilter(null)
    setIsModalOpen(true)
  }

  const handleEdit = (filter: IReportFilter) => {
    setSelectedFilter(filter)
    setIsModalOpen(true)
  }

  const handleDelete = (filter: IReportFilter) => {
    if (confirm(`Hapus filter ${filter.label}?`)) {
      deleteFilter.mutate(filter.id_parameter, {
        onSuccess: () => toast({ title: 'Filter dihapus', variant: 'success' }),
      })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Konfigurasi Filter ({report.filters?.length || 0})
        </h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Filter
        </Button>
      </div>

      <Show
        when={report.filters && report.filters.length > 0}
        fallback={<p className={`text-sm ${mutedClass}`}>Belum ada filter dikonfigurasi.</p>}
      >
        <div className="space-y-3">
          <Each of={report.filters!}>
            {(filter) => (
              <div key={filter.id_parameter} className={`p-4 rounded-xl border flex items-center justify-between ${cardClass}`}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{filter.label}</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {filter.tipe_input}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <code className={`px-2 py-1 rounded text-xs ${codeClass}`}>
                      {filter.nama_filter}
                    </code>
                    {filter.wajib_isi && (
                      <span className="text-red-500 text-xs font-medium">* Wajib</span>
                    )}
                    {filter.nilai_default && (
                      <span className={mutedClass}>
                        Default: <code className={`px-1 rounded text-xs ${codeClass}`}>{filter.nilai_default}</code>
                      </span>
                    )}
                    <span className={`text-xs ${mutedClass}`}>Urutan: {filter.posisi}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(filter)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(filter)} loading={deleteFilter.isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Each>
        </div>
      </Show>

      <FilterFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportId={report.id_laporan}
        filter={selectedFilter}
      />
    </div>
  )
}
