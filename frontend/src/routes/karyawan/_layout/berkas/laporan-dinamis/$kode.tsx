// User Report Viewer Page
// Executes and displays dynamic reports with filters

import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useReportConfig, useExecuteReport } from '@/domains/reports/hooks/useReport'
import { useReportStore } from '@/domains/reports/stores/reportStore'
import { ReportFilters } from '@/domains/reports/components/reports/ReportFilters'
import { ReportTable } from '@/domains/reports/components/reports/ReportTable'
import { ReportDynamicLayout } from '@/domains/reports/components/reports/ReportDynamicLayout'
import { Skeleton } from '@/shared/ui/feedback/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/layout/card'
import { Button } from '@/shared/ui/overlay/button'
import { Alert, AlertDescription } from '@/shared/ui/feedback/alert'
import { Printer } from 'lucide-react'
import '@/styles/print.css'

export const Route = createFileRoute('/karyawan/_layout/berkas/laporan-dinamis/$kode')({
  params: {
    parse: (params) => ({
      kode: params.kode,
    }),
    stringify: (params) => ({
      kode: params.kode,
    }),
  },
  head: () => ({
    meta: [
      { title: 'Report Viewer - DAPEN' },
    ],
  }),
  component: ReportViewerPage,
})

function ReportViewerPage() {
  const { kode } = Route.useParams()
  const [hasGenerated, setHasGenerated] = useState(false)

  // Load report config
  const { data: config, isLoading: configLoading } = useReportConfig(kode)

  // Execute mutation
  const executeMutation = useExecuteReport(kode)
  const result = executeMutation.data
  const isExecuting = executeMutation.isPending

  // Store
  const filterValues = useReportStore((s) => s.filterValues)
  const setFilterValue = useReportStore((s) => s.setFilterValue)
  const resetFilters = useReportStore((s) => s.resetFilters)
  const executionError = useReportStore((s) => s.executionError)

  // Set default values from config
  useEffect(() => {
    if (config?.filters) {
      for (const filter of config.filters) {
        if (filter.nilai_default && !filterValues[filter.nama_filter]) {
          setFilterValue(filter.nama_filter, filter.nilai_default)
        }
      }
    }
  }, [config])

  const handleFilterChange = (name: string, value: string | string[] | null) => {
    setFilterValue(name, value)
  }

  const handleReset = () => {
    resetFilters()
    setHasGenerated(false)
  }

  const handleGenerate = () => {
    executeMutation.mutate(filterValues)
    setHasGenerated(true)
  }

  if (configLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold text-destructive">Report Not Found</h2>
          <p className="text-muted-foreground mt-2">
            Report with kode "{kode}" was not found or you don't have access.
          </p>
          <Link to="/karyawan/berkas/laporan-dinamis" className="mt-4 inline-block text-primary hover:underline">
            Back to Reports
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4 print:hidden">
        <h1 className="text-xl font-semibold">{config.nama_laporan}</h1>
        {config.deskripsi && (
          <p className="text-sm text-muted-foreground mt-1">{config.deskripsi}</p>
        )}
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filter Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilters
            filters={config.filters || []}
            values={filterValues}
            onChange={handleFilterChange}
            onReset={handleReset}
            onSubmit={handleGenerate}
            isSubmitting={isExecuting}
          />
        </CardContent>
      </Card>

      {/* Error */}
      {executionError && (
        <Alert variant="destructive" className="print:hidden">
          <AlertDescription>{executionError}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {hasGenerated && result && (
        <Card className="print:border-none print:shadow-none print:bg-transparent">
          <div className="border-b px-6 py-4 flex items-center justify-between print:hidden">
            <h2 className="text-sm font-medium">Results</h2>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                {result.errors?.length ? `${result.errors.length} errors` : 'Generated successfully'}
              </span>
              <Button
                variant="default"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-2 print:hidden"
              >
                <Printer className="w-4 h-4" />
                Print / PDF
              </Button>
            </div>
          </div>
          <CardContent className="p-0 sm:p-6 print:p-0">
            {config.komponen && config.komponen.length > 0 ? (
              <ReportDynamicLayout result={result} isLoading={isExecuting} />
            ) : (
              <ReportTable result={result} isLoading={isExecuting} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {hasGenerated && !result && !isExecuting && !executionError && (
        <div className="text-center py-12 text-muted-foreground">
          No data returned for the selected filters.
        </div>
      )}
    </div>
  )
}
