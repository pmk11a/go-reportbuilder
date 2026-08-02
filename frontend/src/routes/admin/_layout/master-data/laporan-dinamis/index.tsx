// Admin Reports Management Page
// CRUD for report definitions

import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useCallback } from 'react'
import { Search, Loader2, Plus, FileText, Settings } from 'lucide-react'
import { Input } from '@/shared/ui/form/input'
import { Badge } from '@/shared/ui/overlay/badge'
import { Button } from '@/shared/ui'
import { Each, Show } from '@/shared/ui/layout/Render'
import { useThemeStore } from '@/shared/stores/themeStore'
import { useReport, useReportsInfinite } from '@/domains/reports/hooks/useReport'
import type { IReport, IReportConfig } from '@/domains/reports/types'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { CreateReportModal } from '@/domains/reports/components/reports/CreateReportModal'
import { TabUmum } from '@/domains/reports/components/reports/tabs/TabUmum'
import { TabFilter } from '@/domains/reports/components/reports/tabs/TabFilter'
import { TabDataset } from '@/domains/reports/components/reports/tabs/TabDataset'
import { TabKolom } from '@/domains/reports/components/reports/tabs/TabKolom'
import { TabGrouping } from '@/domains/reports/components/reports/tabs/TabGrouping'
import { TabAkses } from '@/domains/reports/components/reports/tabs/TabAkses'

export const Route = createFileRoute('/admin/_layout/master-data/laporan-dinamis/')({
  head: () => ({
    meta: [{ title: 'Laporan Dinamis - DAPEN' }],
  }),
  component: AdminReportsPage,
})

function AdminReportsPage() {
  const isDark = useThemeStore((state) => state.isDark)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Fetch infinite reports
  const { 
    data: infiniteData, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage 
  } = useReportsInfinite(debouncedSearch)

  // Intersection Observer for infinite scrolling
  const observer = useRef<IntersectionObserver | null>(null)
  const lastReportElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingNextPage) return
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage()
      }
    })
    
    if (node) observer.current.observe(node)
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage])

  // Fetch report config when report is selected
  const { data: reportConfig } = useReport(selectedId)

  // Flatten the pages into a single array
  const allReports = infiniteData?.pages.flatMap(page => page.items) || []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar: Reports list */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Laporan
            </h3>
            <Button size="sm" variant="default" className="h-8" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Baru
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4 px-2">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari laporan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>

          {/* Reports list */}
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
            <Show
              when={!isLoading}
              fallback={
                <div className="px-2 py-3 flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Memuat...</span>
                </div>
              }
            >
              <Show
                when={allReports.length > 0}
                fallback={
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                    {searchTerm ? 'Tidak ada laporan yang cocok' : 'Belum ada laporan'}
                  </div>
                }
              >
                <Each of={allReports}>
                  {(report: IReport, index: number) => {
                    const isLast = index === allReports.length - 1
                    return (
                      <div ref={isLast ? lastReportElementRef : null} key={report.id_laporan}>
                        <ReportListItem
                          report={report}
                          isActive={report.id_laporan === selectedId}
                          onClick={() => setSelectedId(report.id_laporan)}
                          isDark={isDark}
                        />
                      </div>
                    )
                  }}
                </Each>
                {isFetchingNextPage && (
                  <div className="py-4 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                )}
              </Show>
            </Show>
          </div>
        </div>

        {/* Main area: Report detail */}
        <div className="md:col-span-3">
          <Show
            when={reportConfig}
            fallback={
              <div
                className={`h-full min-h-[400px] flex items-center justify-center rounded-3xl border border-slate-100 dark:border-white/5 ${isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}
              >
                <div className="text-center">
                  <Settings className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                  <p className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                    Pilih laporan untuk melihat detail
                  </p>
                </div>
              </div>
            }
          >
            <ReportDetailPanel report={reportConfig as IReportConfig | null | undefined} isDark={isDark} />
          </Show>
        </div>
      </div>
      <CreateReportModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  )
}

function ReportListItem({
  report,
  isActive,
  onClick,
  isDark,
}: {
  report: IReport
  isActive: boolean
  onClick: () => void
  isDark: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-4 py-3 rounded-lg text-sm transition-all flex items-start gap-3 w-full ${
        isActive
          ? isDark
            ? 'bg-primary-600 text-white'
            : 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
          : isDark
            ? 'text-slate-400 hover:bg-slate-700/50'
            : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <FileText className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? '' : 'opacity-60'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{report.nama_laporan || report.KODEMENU}</p>
        <p className={`text-xs mt-0.5 font-mono ${isActive ? 'text-white/70' : 'opacity-60'}`}>
          {report.KODEMENU}
        </p>
      </div>
      <Badge
        variant={report.status_aktif ? 'default' : 'secondary'}
        className={`shrink-0 text-xs ${report.status_aktif ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}`}
      >
        {report.status_aktif ? 'Aktif' : 'Nonaktif'}
      </Badge>
    </button>
  )
}

function ReportDetailPanel({ report, isDark }: { report: IReportConfig | null | undefined; isDark: boolean }) {
  if (!report) return null

  const [activeTab, setActiveTab] = useState<'umum' | 'filter' | 'dataset' | 'kolom' | 'grouping' | 'akses'>('umum')

  const tabList = [
    { id: 'umum' as const, label: 'Umum' },
    { id: 'filter' as const, label: `Filter (${report.filters?.length || 0})` },
    { id: 'dataset' as const, label: `Dataset (${report.datasets?.length || 0})` },
    { id: 'kolom' as const, label: 'Kolom' },
    { id: 'grouping' as const, label: 'Grouping' },
    { id: 'akses' as const, label: 'Akses' },
  ]

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden flex flex-col h-full min-h-[500px]">

      {/* Tabs */}
      <div className="px-6 border-b border-slate-100 dark:border-slate-800">
        <nav className="flex gap-1">
          {tabList.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : isDark
                    ? 'border-transparent text-slate-400 hover:text-slate-200'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <TabContent tab={activeTab} report={report} isDark={isDark} />
      </div>
    </div>
  )
}

function TabContent({ tab, report, isDark }: { tab: string; report: IReportConfig | null | undefined; isDark: boolean }) {
  if (!report) return null

  switch (tab) {
    case 'umum':
      return <TabUmum report={report} isDark={isDark} />
    case 'filter':
      return <TabFilter report={report} isDark={isDark} />
    case 'dataset':
      return <TabDataset report={report} isDark={isDark} />
    case 'kolom':
      return <TabKolom report={report} isDark={isDark} />
    case 'grouping':
      return <TabGrouping report={report} isDark={isDark} />
    case 'akses':
      return <TabAkses report={report} isDark={isDark} />
    default:
      return null
  }
}
