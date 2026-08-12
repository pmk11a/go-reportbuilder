import { createFileRoute } from '@tanstack/react-router'
import { ReportPreview } from '@/domains/reports/components/reports/builder/ReportPreview'
import { useGetTabGeneral, useGetTabFilters, useGetTabKomponen } from '@/domains/reports/hooks/useReportBuilder'
import { useReports, useExecuteReport } from '@/domains/reports/hooks/useReport'
import { Loader2, FileSpreadsheet, FileText, Printer, Filter } from 'lucide-react'
import { BuilderFilterPanel } from '@/domains/reports/components/reports/builder/BuilderFilterPanel'
import { useReportStore } from '@/domains/reports/stores/reportStore'
import { reportViewerService } from '@/domains/reports/services/reportService'
import { Show } from '@/shared/ui'
import { useMemo } from 'react'

export const Route = createFileRoute('/admin/_layout/reports/builder/$kodemenu/generate')({
  component: ReportGeneratorPage,
})

function ReportGeneratorPage() {
  const { kodemenu } = Route.useParams()
  
  // Find report ID by kodeMenu
  const { data: reports } = useReports()
  const reportId = reports?.find(r => r.KODEMENU === kodemenu)?.id_laporan || null

  // Fetch configs
  const { isLoading: l1 } = useGetTabGeneral(reportId)
  const { data: filterConfigs, isLoading: l2 } = useGetTabFilters(reportId)
  const { data: komponenData, isLoading: l3 } = useGetTabKomponen(reportId)

  const layoutConfig = useMemo(() => {
    if (!komponenData || !Array.isArray(komponenData)) return [];
    
    const parseSection = (sectionName: string, type: 'header' | 'body' | 'footer') => {
      const komp = komponenData.find((k: any) => k.nama_komponen === sectionName);
      if (komp?.konfigurasi_layout) {
        try {
          const parsed = typeof komp.konfigurasi_layout === 'string' 
            ? JSON.parse(komp.konfigurasi_layout) 
            : komp.konfigurasi_layout;
          return { type, ...parsed };
        } catch (e) {
          console.error(`Gagal parsing ${sectionName}:`, e);
        }
      }
      return { type, rows: [] };
    };

    return [
      parseSection('HeaderLayout', 'header'),
      parseSection('BodyLayout', 'body'),
      parseSection('FooterLayout', 'footer'),
    ];
  }, [komponenData]);

  const executeReport = useExecuteReport(kodemenu)
  const filterValues = useReportStore((s) => s.filterValues)

  let reportDatasets: Record<string, any[]> = {}
  if (executeReport.data) {
    const rawData = executeReport.data as any
    if (Array.isArray(rawData)) {
      reportDatasets = { default: rawData }
    } else if (rawData.datasets) {
      reportDatasets = rawData.datasets
    } else {
      reportDatasets = { default: rawData.data || rawData.items || [] }
    }
  }

  const hasAnyData = Object.keys(reportDatasets).some(k => reportDatasets[k] && reportDatasets[k].length > 0)

  const handleExportExcel = async () => {
    if (!hasAnyData) {
      alert('Tidak ada data untuk diekspor')
      return
    }
    try {
      await reportViewerService.downloadReport({
        kodeMenu: kodemenu,
        format: 'xlsx',
        filters: filterValues || {},
      })
    } catch (e) {
      console.error('Export XLSX failed:', e)
      alert('Gagal mengekspor: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const handleExportPDF = async () => {
    if (!hasAnyData) {
      alert('Tidak ada data untuk diekspor')
      return
    }
    try {
      await reportViewerService.downloadReport({
        kodeMenu: kodemenu,
        format: 'pdf',
        filters: filterValues || {},
        paperSize: 'a4',
        orientation: 'landscape',
      })
    } catch (e) {
      console.error('Export PDF failed:', e)
      alert('Gagal mengekspor: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const handlePrint = () => {
    window.print() // Simplistic fallback if generatePrintHTML is too tightly coupled to DynamicReportViewer
  }

  const isLoading = l1 || l2 || l3

  if (isLoading || !reportId) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
        <p className="text-slate-500">Memuat konfigurasi laporan...</p>
      </div>
    )
  }



  return (
    <div className="w-full h-full bg-slate-100 dark:bg-slate-900 overflow-auto flex flex-col">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Preview Laporan</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={!hasAnyData}
            data-testid="export-excel"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={!hasAnyData}
            data-testid="export-pdf"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4 text-red-500" /> PDF
          </button>
          <button
            onClick={handlePrint}
            disabled={!hasAnyData}
            data-testid="export-print"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-blue-600" /> Print
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="w-full mx-auto space-y-6 flex flex-col flex-1 px-4 sm:px-6 py-6 max-w-full">
          <BuilderFilterPanel
            kodeMenu={kodemenu}
            filters={filterConfigs || []}
            executeReport={executeReport}
          />

          <Show
            when={!!executeReport.data || executeReport.isPending}
            fallback={
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border border-slate-100 dark:border-white/5 border-dashed min-h-[300px]">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                  <Filter className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-center font-medium mb-1 text-slate-600 dark:text-slate-300">
                  Data Belum Ditampilkan
                </p>
                <p className="text-center text-sm max-w-sm mb-4">
                  Silakan sesuaikan parameter filter di atas, kemudian klik "Generate" untuk menampilkan laporan.
                </p>
              </div>
            }
          >
            {executeReport.isPending ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-500">Mengeksekusi laporan...</p>
              </div>
            ) : executeReport.isError ? (
              <div className="flex-1 flex items-center justify-center p-12 bg-red-50 dark:bg-red-500/10 rounded-3xl border border-red-100 dark:border-red-500/20 text-red-600 min-h-[300px]">
                Gagal memuat laporan: {executeReport.error?.message}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[800px]">
                <ReportPreview 
                  config={layoutConfig}
                  zoom={1}
                  orientation="portrait"
                  datasets={reportDatasets}
                />
              </div>
            )}
          </Show>
        </div>
      </div>
    </div>
  )
}
