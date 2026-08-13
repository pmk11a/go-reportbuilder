import { createFileRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import { Plus, Play, LayoutDashboard, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useReports } from '@/domains/reports/hooks/useReport'
import { useThemeStore } from '@/shared/stores/themeStore'
import { Each, Show, CollapsibleSidebarLayout } from '@/shared/ui/layout'
import { useDebounce } from '@/shared/hooks'
import { Button } from '@/shared/ui'
import { reportService } from '@/domains/reports/services/reportService'
import { useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/admin/_layout/reports/builder')({
  component: ReportBuilderLayout,
})

function ReportBuilderLayout() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const { data: reports, isLoading } = useReports()
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  const queryClient = useQueryClient()

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('Yakin ingin menghapus laporan ini? Seluruh data tab akan hilang.')) {
      const success = await reportService.deleteReport(id);
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['reports'] });
      } else {
        alert('Gagal menghapus laporan');
      }
    }
  }

  const location = useLocation()
  const pathParts = location.pathname.split('/')
  // Extract kodemenu from path: /admin/reports/builder/{kodemenu}/edit
  const activeKodeMenu = pathParts.length >= 5 ? pathParts[4] : ''

  const filteredReports = reports?.filter(r => 
    r.nama_laporan.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
    r.KODEMENU.toLowerCase().includes(debouncedSearch.toLowerCase())
  ) || []

  const sidebarCustomContent = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b dark:border-slate-800">
        <Link to="/admin/reports/builder/$kodemenu/edit" params={{ kodemenu: 'new' }} className="block w-full">
          <Button variant="default" className="w-full flex items-center justify-center">
            <Plus className="w-4 h-4 mr-2" /> Buat Laporan Baru
          </Button>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <Show when={!isLoading} fallback={
          <div className="p-4 text-center text-slate-500 text-sm animate-pulse">Memuat...</div>
        }>
          <Show when={filteredReports.length > 0} fallback={
            <div className="p-4 text-center text-slate-500 text-sm">Tidak ada laporan.</div>
          }>
            <Each of={filteredReports}>
              {(report) => (
                <div 
                  key={report.id_laporan}
                  className={`group flex items-center justify-between p-2 rounded-lg transition-colors ${
                    activeKodeMenu === report.KODEMENU 
                      ? (isDark ? 'bg-primary-900/50 text-primary-300' : 'bg-primary-50 text-primary-700')
                      : (isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700')
                  }`}
                >
                  <Link 
                    to="/admin/reports/builder/$kodemenu/edit"
                    params={{ kodemenu: report.KODEMENU }}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeKodeMenu === report.KODEMENU ? 'text-primary-500' : 'text-slate-400'}`} />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{report.nama_laporan}</span>
                      <span className="text-[10px] font-mono text-slate-400">{report.KODEMENU}</span>
                    </div>
                  </Link>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to="/admin/reports/builder/$kodemenu/generate" params={{ kodemenu: report.KODEMENU }}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/50">
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={(e) => handleDelete(report.id_laporan, e)} className="h-7 w-7 p-0 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Each>
          </Show>
        </Show>
      </div>
    </div>
  )

  const mainContent = (
    <div className={`rounded-3xl border shadow-xl overflow-hidden flex-1 flex flex-col h-full ${
      isDark 
        ? 'bg-[#0f172a] border-white/5 shadow-2xl' 
        : 'bg-white border-slate-100 shadow-blue-500/5'
    }`}>
      <Outlet />
    </div>
  )

  return (
    <div className="h-[calc(100vh-80px)]">
      <CollapsibleSidebarLayout
        sidebarTitle="Report Builder"
        searchPlaceholder="Cari Kode atau Nama..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        sidebarCustomContent={sidebarCustomContent}
        mainContent={mainContent}
      />
    </div>
  )
}
