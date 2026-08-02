import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { Search, FileText, Folder, Menu } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/shared/ui'
import { useReportsMenu } from '@/domains/reports/hooks/useReport'
import type { IReportMenuItem } from '@/domains/reports/types'
import { useThemeStore } from '@/shared/stores/themeStore'
import { Each, Show } from '@/shared/ui/layout/Render'
import { useDebounce } from '@/shared/hooks'

export const Route = createFileRoute('/admin/_layout/reports/laporan')({
  component: LaporanDinamisLayout,
})

function LaporanDinamisLayout() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const { data: menuItems, isLoading } = useReportsMenu(debouncedSearch)
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'

  // We could extract the active ID to highlight it
  // Since we don't have access to the matched route params directly here without a hook,
  // we'll rely on active link styling if possible, but manually checking is better.
  const params = Route.useParams() as any
  const selectedKode = params?.kodeMenu || ''
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-6 flex-1 min-h-0 relative">
        {/* Sidebar Master List */}
        <div 
          className={`transition-all duration-300 shrink-0 flex flex-col h-full overflow-hidden ${
            isSidebarOpen ? 'w-full md:w-[320px] opacity-100' : 'w-0 opacity-0 md:!p-0 md:!border-0'
          } rounded-3xl border shadow-xl ${
            isDark 
              ? 'bg-[#0f172a] border-white/5 shadow-2xl' 
              : 'bg-white border-slate-100 shadow-blue-500/5'
          }`}
        >
          <div className="p-4 flex flex-col h-full min-w-[280px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className={`font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Daftar Laporan</h3>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                title="Sembunyikan Daftar Laporan"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative mb-4 px-2 shrink-0">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                className={`pl-9 h-9 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`} 
                placeholder="Cari laporan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Scrollable list */}
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 no-scrollbar flex-1">
              <Show when={!isLoading} fallback={
                <div className="p-4 text-center text-secondary-400">Memuat...</div>
              }>
                {menuItems && menuItems.length > 0 ? (
                  <div className="space-y-1">
                    <Each of={menuItems}>
                      {(item) => (
                        <MenuNode 
                          item={item} 
                          searchQuery={searchQuery} 
                          selectedKode={selectedKode}
                          isDark={isDark} 
                        />
                      )}
                    </Each>
                  </div>
                ) : (
                  <div className="p-4 text-center text-secondary-400 text-sm">Tidak ada laporan.</div>
                )}
              </Show>
            </div>
          </div>
        </div>

        {/* Main Content (Detail) */}
        <div className="flex-1 flex flex-col min-h-0 relative w-full">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="absolute -left-3 top-6 z-50 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg text-slate-500 hover:text-primary-500 transition-colors"
              title="Tampilkan Daftar Laporan"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <div className={`rounded-3xl border shadow-xl overflow-hidden flex-1 flex flex-col ${
            isDark 
              ? 'bg-[#0f172a] border-white/5 shadow-2xl' 
              : 'bg-white border-slate-100 shadow-blue-500/5'
          }`}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuNode({ 
  item, 
  depth = 0, 
  searchQuery, 
  selectedKode,
  isDark 
}: { 
  item: IReportMenuItem; 
  depth?: number; 
  searchQuery: string;
  selectedKode: string;
  isDark: boolean;
}) {
  const hasChildren = item.children && item.children.length > 0
  const isLeaf = !hasChildren

  return (
    <div className="w-full">
      {isLeaf ? (
        <Link 
          to="/admin/reports/laporan/$kodeMenu"
          params={{ kodeMenu: item.KODEMENU }}
          className={`flex items-start gap-3 p-2.5 rounded-lg text-sm transition-all mb-1 ${
            selectedKode === item.KODEMENU
              ? isDark 
                ? "bg-primary-600 text-white" 
                : "bg-primary-600 text-white shadow-md shadow-primary-500/20"
              : isDark 
                ? "text-slate-400 hover:bg-slate-700/50" 
                : "text-slate-600 hover:bg-slate-50"
          }`}
          style={{ paddingLeft: `${(depth * 16) + 12}px` }}
        >
          <FileText className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-medium truncate">{item.NmReport}</span>
            <span className={`text-xs font-mono mt-0.5 ${selectedKode === item.KODEMENU ? 'opacity-80' : 'text-slate-400'}`}>
              {item.KODEMENU}
            </span>
          </div>
        </Link>
      ) : (
        <div className="mb-2">
          <div 
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-secondary-500 uppercase tracking-wider"
            style={{ paddingLeft: `${(depth * 16) + 12}px` }}
          >
            <Folder className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{item.NmReport}</span>
          </div>
          <div className="space-y-0.5">
            <Each of={item.children}>
              {(child) => (
                <MenuNode 
                  item={child} 
                  depth={depth + 1} 
                  searchQuery={searchQuery}
                  selectedKode={selectedKode}
                  isDark={isDark} 
                />
              )}
            </Each>
          </div>
        </div>
      )}
    </div>
  )
}
