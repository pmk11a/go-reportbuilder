import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import {
  PermissionReportActions,
  PermissionReportFilters,
  PermissionReportTable,
} from '@/components/admin/reports/permission-report'
import { usePermissionReportMatrix } from '@/hooks/usePermissionReport'
import type { IPermissionReportFilters } from '@/types/permissionReport'
import '@/styles/print.css'

export const Route = createFileRoute('/admin/_layout/reports/permission-report/')({
  component: PermissionReportPage,
})

const INITIAL_FILTERS: IPermissionReportFilters = {
  menu_type: 'menu',
  page: 1,
  per_page: 50,
}

function PermissionReportPage() {
  const { t } = useTranslation(['reports', 'common'])

  // Draft = the picker state. Applied = the committed filter the table reads.
  // This split lets us debounce expensive matrix re-renders to the moment the
  // user explicitly clicks "Apply Filters".
  const [draftFilters, setDraftFilters] = useState<IPermissionReportFilters>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<IPermissionReportFilters>(INITIAL_FILTERS)

  const { data, isLoading, isFetching } = usePermissionReportMatrix(appliedFilters)

  const rows = data?.data ?? []
  const isFiltered = useMemo(
    () => Boolean(appliedFilters.user_id || appliedFilters.menu_id),
    [appliedFilters]
  )

  const handleApply = () => {
    setAppliedFilters(draftFilters)
  }

  const handleReset = () => {
    setDraftFilters(INITIAL_FILTERS)
    setAppliedFilters(INITIAL_FILTERS)
  }

  return (
    <div className="space-y-6 p-8 permission-report-page">
      <Helmet>
        <title>{t('permission_report.title')} - DAPEN</title>
        <meta name="description" content={t('permission_report.description')} />
      </Helmet>

      <PermissionReportFilters
        value={draftFilters}
        onChange={setDraftFilters}
        onApply={handleApply}
        onReset={handleReset}
        isApplying={isFetching}
      />

      <div className="flex justify-end">
        <PermissionReportActions filters={appliedFilters} hasFilter={isFiltered} />
      </div>

      <PermissionReportTable
        rows={rows}
        isLoading={isLoading}
        isFiltered={isFiltered}
      />
    </div>
  )
}
