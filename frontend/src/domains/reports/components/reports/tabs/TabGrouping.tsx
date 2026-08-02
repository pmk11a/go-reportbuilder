import { useState } from 'react'
import { Plus, Settings, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui'
import { Badge } from '@/shared/ui/overlay/badge'
import { Each, Show } from '@/shared/ui/layout/Render'
import type { IReportConfig, IReportGroup } from '@/domains/reports/types'
import { useReportMutations } from '@/domains/reports/hooks/useReportMutations'
import { useToast } from '@/shared/hooks/use-toast'
import { GroupFormModal } from '../modals/GroupFormModal'

export function TabGrouping({ report, isDark }: { report: IReportConfig; isDark: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<IReportGroup | null>(null)
  
  const { deleteGroup } = useReportMutations(report.id_laporan)
  const { toast } = useToast()

  const cardClass = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
  const mutedClass = isDark ? 'text-slate-500' : 'text-slate-400'
  const codeClass = isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'

  const handleAdd = () => {
    setSelectedGroup(null)
    setIsModalOpen(true)
  }

  const handleEdit = (group: IReportGroup) => {
    setSelectedGroup(group)
    setIsModalOpen(true)
  }

  const handleDelete = (group: IReportGroup) => {
    if (confirm(`Hapus grouping ${group.label}?`)) {
      deleteGroup.mutate(group.id_group, {
        onSuccess: () => toast({ title: 'Grouping dihapus', variant: 'success' }),
      })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Konfigurasi Grouping ({report.groups?.length || 0})
        </h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Grouping
        </Button>
      </div>

      <Show
        when={report.groups && report.groups.length > 0}
        fallback={<p className={`text-sm ${mutedClass}`}>Belum ada grouping dikonfigurasi.</p>}
      >
        <div className="space-y-3">
          <Each of={report.groups!}>
            {(group) => (
              <div key={group.id_group} className={`p-4 rounded-xl border flex items-center justify-between ${cardClass}`}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Level {group.group_level}: {group.label}</span>
                    {group.special_handling && (
                      <Badge variant="outline" className="text-xs">
                        {group.special_handling}
                      </Badge>
                    )}
                  </div>
                  {group.group_field && (
                    <p className={`text-sm mt-1 ${mutedClass}`}>
                      Field: <code className={`px-2 py-1 rounded text-xs ${codeClass}`}>{group.group_field}</code>
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(group)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(group)} loading={deleteGroup.isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Each>
        </div>
      </Show>

      <GroupFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportId={report.id_laporan}
        group={selectedGroup}
      />
    </div>
  )
}
