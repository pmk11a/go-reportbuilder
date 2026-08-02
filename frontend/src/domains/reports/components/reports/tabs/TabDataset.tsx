import { useState } from 'react'
import { Plus, Settings, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui'
import { Badge } from '@/shared/ui/overlay/badge'
import { Each, Show } from '@/shared/ui/layout/Render'
import type { IReportConfig, IReportDataset } from '@/domains/reports/types'
import { useReportMutations } from '@/domains/reports/hooks/useReportMutations'
import { useToast } from '@/shared/hooks/use-toast'
import { DatasetFormModal } from '../modals/DatasetFormModal'

export function TabDataset({ report, isDark }: { report: IReportConfig; isDark: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDataset, setSelectedDataset] = useState<IReportDataset | null>(null)
  
  const { deleteDataset } = useReportMutations(report.id_laporan)
  const { toast } = useToast()

  const mutedClass = isDark ? 'text-slate-500' : 'text-slate-400'
  const cardClass = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
  const codeClass = isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'

  const handleAdd = () => {
    setSelectedDataset(null)
    setIsModalOpen(true)
  }

  const handleEdit = (dataset: IReportDataset) => {
    setSelectedDataset(dataset)
    setIsModalOpen(true)
  }

  const handleDelete = (dataset: IReportDataset) => {
    if (confirm(`Hapus dataset ${dataset.nama_dataset}?`)) {
      deleteDataset.mutate(dataset.id_query, {
        onSuccess: () => toast({ title: 'Dataset dihapus', variant: 'success' }),
      })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Konfigurasi Dataset ({report.datasets?.length || 0})
        </h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Dataset
        </Button>
      </div>

      <Show
        when={report.datasets && report.datasets.length > 0}
        fallback={<p className={`text-sm ${mutedClass}`}>Belum ada dataset dikonfigurasi.</p>}
      >
        <div className="space-y-3">
          <Each of={report.datasets!}>
            {(ds) => (
              <div key={ds.id_query} className={`p-4 rounded-xl border flex justify-between items-start ${cardClass}`}>
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono font-medium">{ds.nama_dataset}</span>
                    <Badge
                      variant={ds.visible ? 'default' : 'secondary'}
                      className={`text-xs ${ds.visible ? 'bg-green-500/20 text-green-400' : ''}`}
                    >
                      {ds.visible ? 'Visible' : 'Hidden'}
                    </Badge>
                  </div>
                  {ds.deskripsi && (
                    <p className={`text-sm mb-2 ${mutedClass}`}>{ds.deskripsi}</p>
                  )}
                  <div className={`mt-2 p-2 rounded text-xs font-mono ${codeClass} overflow-x-auto`}>
                    <pre className="whitespace-pre-wrap break-all">{ds.query_sumber_data}</pre>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(ds)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(ds)} loading={deleteDataset.isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Each>
        </div>
      </Show>

      <DatasetFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportId={report.id_laporan}
        dataset={selectedDataset}
      />
    </div>
  )
}
