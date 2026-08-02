import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui'
import { Badge } from '@/shared/ui/overlay/badge'
import { Each, Show } from '@/shared/ui/layout/Render'
import type { IReportConfig, IReportUserAccess } from '@/domains/reports/types'
import { reportService } from '@/domains/reports/services/reportService'
import { useReportMutations } from '@/domains/reports/hooks/useReportMutations'
import { useToast } from '@/shared/hooks/use-toast'
import { AccessFormModal } from '../modals/AccessFormModal'
import { useQuery } from '@tanstack/react-query'

export function TabAkses({ report, isDark }: { report: IReportConfig; isDark: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { revokeAccess } = useReportMutations(report.id_laporan)
  const { toast } = useToast()

  const cardClass = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
  const mutedClass = isDark ? 'text-slate-500' : 'text-slate-400'

  // Fetch access data
  const { data: accessList, isLoading } = useQuery({
    queryKey: ['admin', 'reports', report.id_laporan, 'access'],
    queryFn: () => reportService.getUserAccess(report.id_laporan),
  })

  const handleDelete = (access: IReportUserAccess) => {
    if (confirm(`Cabut akses untuk user ${access.USERID}?`)) {
      revokeAccess.mutate(access.USERID, {
        onSuccess: () => toast({ title: 'Akses dicabut', variant: 'success' }),
      })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Hak Akses ({accessList?.length || 0})
        </h3>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Beri Akses
        </Button>
      </div>

      {isLoading ? (
        <p className={`text-sm ${mutedClass}`}>Memuat data akses...</p>
      ) : (
        <Show
          when={accessList && accessList.length > 0}
          fallback={<p className={`text-sm ${mutedClass}`}>Belum ada user yang diberikan akses.</p>}
        >
          <div className="space-y-3">
            <Each of={accessList!}>
              {(access) => (
                <div key={access.USERID} className={`p-4 rounded-xl border flex items-center justify-between ${cardClass}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{access.USERID}</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={`text-xs ${access.Access ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                        {access.Access ? 'Access: Yes' : 'Access: No'}
                      </Badge>
                      {access.IsDesign && (
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-500">
                          Design
                        </Badge>
                      )}
                      {access.IsExport && (
                        <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                          Export
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(access)} loading={revokeAccess.isPending}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Cabut
                  </Button>
                </div>
              )}
            </Each>
          </div>
        </Show>
      )}

      <AccessFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportId={report.id_laporan}
      />
    </div>
  )
}
