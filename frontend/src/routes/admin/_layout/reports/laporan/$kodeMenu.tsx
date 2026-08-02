import { createFileRoute } from '@tanstack/react-router'
import { DynamicReportViewer } from '@/domains/reports/components/viewer/DynamicReportViewer'

export const Route = createFileRoute('/admin/_layout/reports/laporan/$kodeMenu')({
  head: ({ match }) => ({
    meta: [
      { title: `Report ${match.params.kodeMenu} - DAPEN` },
    ],
  }),
  component: DynamicReportViewerPage,
})

function DynamicReportViewerPage() {
  const { kodeMenu } = Route.useParams()
  return <DynamicReportViewer kodeMenu={kodeMenu} />
}
