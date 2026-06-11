import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { id, enUS } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Each, Show } from '@/components/ui/layout/Render'
import { useActivityLogsByUser } from '@/hooks/useActivityLog'
import { IActivityLogRes } from '@/types/activity-log'

interface IUserActivityTabProps {
  userId: string
}

/**
 * UserActivityTab displays activity logs for a specific user.
 */
export function UserActivityTab({ userId }: IUserActivityTabProps) {
  const { t, i18n } = useTranslation(['logs', 'common'])
  const dateLocale = i18n.language === 'id' ? id : enUS

  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')
  const [selectedLog, setSelectedLog] = useState<IActivityLogRes | null>(null)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [appliedSearch, appliedStartDate, appliedEndDate])

  const { data: logsResponse, isLoading, isFetching, error } = useActivityLogsByUser(
    userId,
    { page, limit, query: appliedSearch, startDate: appliedStartDate, endDate: appliedEndDate }
  )

  const logs = logsResponse?.data || []
  const meta = logsResponse?.meta
  const total = meta?.total ?? 0
  const totalPages = meta?.limit ? Math.ceil(total / meta.limit) : 1

  const handleSearch = () => {
    setAppliedSearch(searchTerm)
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE')) return <Badge variant="success">{action}</Badge>
    if (action.includes('UPDATE')) return <Badge variant="info">{action}</Badge>
    if (action.includes('DELETE')) return <Badge variant="danger">{action}</Badge>
    return <Badge variant="default">{action}</Badge>
  }

  return (
    <>
      <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('userActivityLog.title', 'Activity Log')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('userActivityLog.description', 'Activity log for {{name}}', { name: userId })}
            </p>
          </div>

          {/* Filter Section */}
          <div className="flex flex-wrap gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl mb-4">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder={t('userActivityLog.startDate', 'Start Date')}
              className="w-40"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder={t('userActivityLog.endDate', 'End Date')}
              className="w-40"
            />
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder={t('userActivityLog.search', 'Search...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={isFetching}>
              {t('userActivityLog.search', 'Search')}
            </Button>
          </div>

          {/* Loading State */}
          <Show when={isLoading}>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Show>

          {/* Error State */}
          <Show when={!isLoading && error}>
            <div className="p-4 text-center text-red-500">
              {t('userActivityLog.error', 'Failed to load activity logs')}
            </div>
          </Show>

          {/* Empty State */}
          <Show when={!isLoading && !error && logs.length === 0}>
            <div className="p-8 text-center text-slate-500">
              {t('userActivityLog.noLogs', 'No activity logs')}
            </div>
          </Show>

          {/* Table */}
          <Show when={!isLoading && !error && logs.length > 0}>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <Table>
                <TableHeader className="bg-primary-600 dark:bg-white/5 border-b-2 border-primary-700 dark:border-white/10 [&_tr]:hover:bg-transparent">
                  <TableRow>
                    <TableHead className="text-white dark:text-primary-400 uppercase text-xs tracking-wider">
                      {t('userActivityLog.headers.datetime', 'Tanggal')}
                    </TableHead>
                    <TableHead className="text-white dark:text-primary-400 uppercase text-xs tracking-wider">
                      {t('userActivityLog.headers.activity', 'Aktivitas')}
                    </TableHead>
                    <TableHead className="text-white dark:text-primary-400 uppercase text-xs tracking-wider">
                      {t('userActivityLog.headers.source', 'Sumber')}
                    </TableHead>
                    <TableHead className="text-white dark:text-primary-400 uppercase text-xs tracking-wider">
                      {t('userActivityLog.headers.ref', 'No Bukti')}
                    </TableHead>
                    <TableHead className="text-white dark:text-primary-400 uppercase text-xs tracking-wider">
                      {t('userActivityLog.headers.description', 'Keterangan')}
                    </TableHead>
                    <TableHead className="text-center text-white dark:text-primary-400 uppercase text-xs tracking-wider">
                      {t('userActivityLog.headers.actions', 'Aksi')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <Each of={logs}>
                    {(log: IActivityLogRes) => (
                      <TableRow className="border-b border-primary-300 dark:border-white/5 hover:bg-primary-50/50 dark:hover:bg-white/5 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">
                              {format(new Date(log.tanggal), 'dd MMM yyyy', { locale: dateLocale })}
                            </span>
                            <span className="text-xs text-slate-500">
                              {format(new Date(log.tanggal), 'HH:mm:ss', { locale: dateLocale })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.aktivitas)}</TableCell>
                        <TableCell>{log.sumber}</TableCell>
                        <TableCell className="font-mono text-sm">{log.no_bukti}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {log.keterangan}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setSelectedLog(log)}
                            title={t('userActivityLog.viewDetail', 'Lihat detail')}
                            aria-label={t('userActivityLog.viewDetail', 'Lihat detail')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </Each>
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 mt-4">
              <div className="text-sm text-slate-500">
                {t('userActivityLog.pageInfo', 'Page {{current}} of {{total}} ({{count}} items)', {
                  current: page,
                  total: totalPages,
                  count: total,
                })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('common.previous', 'Previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isFetching}
                >
                  {t('common.next', 'Next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </Show>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={selectedLog !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedLog(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('userActivityLog.detailTitle', 'Detail Log Aktivitas')}</DialogTitle>
            <DialogDescription>
              {t('userActivityLog.detailDescription', 'Informasi lengkap aktivitas yang dipilih.')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('userActivityLog.headers.activity', 'Aktivitas')}
              </p>
              {getActionBadge(selectedLog?.aktivitas ?? '-')}
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('userActivityLog.detailTime', 'Waktu')}
              </p>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {selectedLog
                  ? format(new Date(selectedLog.tanggal), 'dd MMMM yyyy, HH:mm:ss', { locale: dateLocale })
                  : '-'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('userActivityLog.headers.source', 'Sumber')}
              </p>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {selectedLog?.sumber || '-'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('userActivityLog.headers.ref', 'No Bukti')}
              </p>
              <p className="font-mono text-sm text-slate-700 dark:text-slate-300">
                {selectedLog?.no_bukti || '-'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('userActivityLog.detailUser', 'Pelaku')}
              </p>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {selectedLog?.pemakai || userId || '-'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('userActivityLog.headers.description', 'Keterangan')}
              </p>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {selectedLog?.keterangan || t('userActivityLog.noDescription', 'Tidak ada keterangan.')}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedLog(null)}>
              {t('userActivityLog.closeDetail', 'Tutup')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}