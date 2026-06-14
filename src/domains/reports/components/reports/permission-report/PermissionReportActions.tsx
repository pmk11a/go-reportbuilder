import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'
import { Loader2, Printer, FileSpreadsheet, FileText } from 'lucide-react'
import {
  useDownloadPermissionReportExcel,
  useDownloadPermissionReportPDF,
} from '@/domains/reports/hooks/usePermissionReport'
import { useToast } from '@/shared/hooks/use-toast'
import { formatAPIError } from '@/shared/utils/errorMapper'
import { Show } from '@/shared/ui/layout/Render'
import type { IPermissionReportFilters } from '@/domains/reports/permissionReport'

export interface PermissionReportActionsProps {
  filters: IPermissionReportFilters
  /** True when at least one of `user_id` / `menu_id` is set. */
  hasFilter: boolean
}

/**
 * Action buttons for the Permission Report page: Print, Export Excel, Export PDF.
 *
 * Print uses the browser's built-in `window.print()` and relies on
 * `frontend/src/styles/print.css` to hide non-essential chrome.
 *
 * Export buttons trigger their respective downloads via the React Query
 * mutations. Both are disabled until the user applies at least one filter
 * (the BFF and backend enforce the same rule defensively).
 */
export function PermissionReportActions({
  filters,
  hasFilter,
}: PermissionReportActionsProps) {
  const { t } = useTranslation(['reports', 'common'])
  const { toast } = useToast()

  const excelMutation = useDownloadPermissionReportExcel()
  const pdfMutation = useDownloadPermissionReportPDF()

  const triggerDownload = (blob: Blob, filename: string) => {
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(objectUrl)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = async () => {
    try {
      const blob = await excelMutation.mutateAsync(filters)
      triggerDownload(blob, `permission-report-${Date.now()}.xlsx`)
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status ?? 500
      const msg = (error as { message?: string })?.message ?? ''
      toast({
        title: t('common:error', { defaultValue: 'Error' }),
        description: formatAPIError(status, msg) || t('permission_report.errors.export_failed'),
        variant: 'destructive',
      })
    }
  }

  const handleExportPDF = async () => {
    try {
      const blob = await pdfMutation.mutateAsync(filters)
      triggerDownload(blob, `permission-report-${Date.now()}.pdf`)
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status ?? 500
      const msg = (error as { message?: string })?.message ?? ''
      toast({
        title: t('common:error', { defaultValue: 'Error' }),
        description: formatAPIError(status, msg) || t('permission_report.errors.export_failed'),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-wrap gap-2 permission-report-actions">
      <Button
        variant="outline"
        onClick={handlePrint}
        aria-label={t('permission_report.actions.print')}
      >
        <Printer className="h-4 w-4 mr-2" aria-hidden="true" />
        {t('permission_report.actions.print')}
      </Button>

      <Button
        variant="outline"
        onClick={handleExportExcel}
        disabled={!hasFilter || excelMutation.isPending}
        aria-label={t('permission_report.actions.excel')}
      >
        <Show
          when={excelMutation.isPending}
          fallback={<FileSpreadsheet className="h-4 w-4 mr-2" aria-hidden="true" />}
        >
          <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
        </Show>
        {t('permission_report.actions.excel')}
      </Button>

      <Button
        variant="outline"
        onClick={handleExportPDF}
        disabled={!hasFilter || pdfMutation.isPending}
        aria-label={t('permission_report.actions.pdf')}
      >
        <Show
          when={pdfMutation.isPending}
          fallback={<FileText className="h-4 w-4 mr-2" aria-hidden="true" />}
        >
          <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
        </Show>
        {t('permission_report.actions.pdf')}
      </Button>
    </div>
  )
}
