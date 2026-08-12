import { createFileRoute } from '@tanstack/react-router'
import { ReportPreview } from '@/domains/reports/components/reports/builder/ReportPreview'
import { useGetTabGeneral, useGetTabFilters, useGetTabLayout } from '@/domains/reports/hooks/useReportBuilder'
import { useReports } from '@/domains/reports/hooks/useReport'
import { Loader2 } from 'lucide-react'

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
  const { isLoading: l2 } = useGetTabFilters(reportId)
  const { data: header, isLoading: l3 } = useGetTabLayout(reportId, 'header')
  const { data: body, isLoading: l4 } = useGetTabLayout(reportId, 'body')
  const { data: footer, isLoading: l5 } = useGetTabLayout(reportId, 'footer')

  const isLoading = l1 || l2 || l3 || l4 || l5

  if (isLoading || !reportId) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
        <p className="text-slate-500">Memuat konfigurasi laporan...</p>
      </div>
    )
  }

  const layoutConfig = [
    header,
    body,
    footer
  ].filter(Boolean) as any[]

  return (
    <div className="w-full h-full bg-slate-100 dark:bg-slate-900 overflow-auto">
      <div className="max-w-[1200px] mx-auto p-4 md:p-8">
        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10 min-h-[800px]">
          <ReportPreview 
            config={layoutConfig}
            zoom={1}
            orientation="portrait"
          />
        </div>
      </div>
    </div>
  )
}
