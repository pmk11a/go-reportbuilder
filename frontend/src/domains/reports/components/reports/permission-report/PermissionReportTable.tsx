import { useTranslation } from 'react-i18next'
import {
  Card,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { Each, Show } from '@/shared/ui/layout/Render'
import { FileBarChart2 } from 'lucide-react'
import type { IPermissionReportRow } from '@/domains/reports/types/permissionReport'

export interface PermissionReportTableProps {
  rows: IPermissionReportRow[]
  isLoading?: boolean
  isFiltered?: boolean
}

/** All permission flag fields in display order. */
const PERMISSION_FIELDS: Array<{
  key: keyof IPermissionReportRow
  i18nKey: string
}> = [
  { key: 'has_access',   i18nKey: 'permission_report.table.headers.has_access' },
  { key: 'is_create',    i18nKey: 'permission_report.table.headers.create' },
  { key: 'is_update',    i18nKey: 'permission_report.table.headers.update' },
  { key: 'is_delete',    i18nKey: 'permission_report.table.headers.delete' },
  { key: 'is_print',     i18nKey: 'permission_report.table.headers.print' },
  { key: 'is_export',    i18nKey: 'permission_report.table.headers.export' },
  { key: 'is_approve_1', i18nKey: 'permission_report.table.headers.approve_1' },
  { key: 'is_approve_2', i18nKey: 'permission_report.table.headers.approve_2' },
  { key: 'is_approve_3', i18nKey: 'permission_report.table.headers.approve_3' },
  { key: 'is_approve_4', i18nKey: 'permission_report.table.headers.approve_4' },
  { key: 'is_approve_5', i18nKey: 'permission_report.table.headers.approve_5' },
  { key: 'is_canceled',  i18nKey: 'permission_report.table.headers.canceled' },
]

/**
 * Renders the matrix produced by the Permission Report endpoint.
 *
 * - Horizontally scrollable: the matrix has 17 columns.
 * - Empty state when there are no rows.
 * - Skeleton rows while loading.
 * - Each row's permission cells are rendered with check (✓) or cross (✗)
 *   plus an `aria-label` for screen readers.
 */
export function PermissionReportTable({
  rows,
  isLoading,
  isFiltered,
}: PermissionReportTableProps) {
  const { t } = useTranslation(['reports', 'common'])

  return (
    <Card className="overflow-hidden permission-report-table">
      <div className="overflow-x-auto">
        <Show
          when={isLoading === true}
          fallback={
            <Show
              when={rows.length === 0}
              fallback={
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="min-w-[140px]">
                        {t('permission_report.table.headers.user')}
                      </TableHead>
                      <TableHead className="min-w-[180px]">
                        {t('permission_report.table.headers.full_name')}
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        {t('permission_report.table.headers.role')}
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        {t('permission_report.table.headers.menu_code')}
                      </TableHead>
                      <TableHead className="min-w-[220px]">
                        {t('permission_report.table.headers.menu_name')}
                      </TableHead>
                      <Each of={PERMISSION_FIELDS}>
                        {(field) => (
                          <TableHead
                            key={String(field.key)}
                            className="w-20 text-center text-xs"
                          >
                            {t(field.i18nKey)}
                          </TableHead>
                        )}
                      </Each>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <Each of={rows}>
                      {(row: IPermissionReportRow, idx: number) => (
                        <TableRow
                          key={`${row.user_id}-${row.menu_code}-${idx}`}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                        >
                          <TableCell className="font-mono text-xs">{row.username}</TableCell>
                          <TableCell className="text-sm">{row.full_name}</TableCell>
                          <TableCell className="text-sm capitalize">{row.role}</TableCell>
                          <TableCell className="font-mono text-xs">{row.menu_code}</TableCell>
                          <TableCell className="text-sm">{row.menu_name}</TableCell>
                          <Each of={PERMISSION_FIELDS}>
                            {(field) => {
                              const v = row[field.key] as number
                              const yes = v === 1
                              return (
                                <TableCell
                                  key={String(field.key)}
                                  className="text-center text-sm"
                                >
                                  <Show
                                    when={yes}
                                    fallback={
                                      <span
                                        aria-label={t('permission_report.table.no')}
                                        className="text-slate-300 dark:text-slate-600"
                                      >
                                        ✗
                                      </span>
                                    }
                                  >
                                    <span
                                      aria-label={t('permission_report.table.yes')}
                                      className="text-emerald-600 dark:text-emerald-400 font-semibold"
                                    >
                                      ✓
                                    </span>
                                  </Show>
                                </TableCell>
                              )
                            }}
                          </Each>
                        </TableRow>
                      )}
                    </Each>
                  </TableBody>
                </Table>
              }
            >
              <div className="p-10">
                <EmptyState
                  icon={<FileBarChart2 className="h-10 w-10 text-muted-foreground" />}
                  title={t('permission_report.table.empty')}
                  description={
                    isFiltered
                      ? t('permission_report.table.empty')
                      : t('permission_report.table.empty')
                  }
                />
              </div>
            </Show>
          }
        >
          <div className="p-4 space-y-2" aria-label={t('common:loading', { defaultValue: 'Loading' })}>
            <Each of={Array.from({ length: 6 })}>
              {(_, i) => <Skeleton key={i} className="h-8 w-full" />}
            </Each>
          </div>
        </Show>
      </div>
    </Card>
  )
}
