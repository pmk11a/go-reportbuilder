import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface IUserTablePaginationProps {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

export function UserTablePagination({
  page,
  limit,
  total,
  onPageChange,
}: IUserTablePaginationProps) {
  const { t } = useTranslation(['common'])

  const totalPages = Math.ceil(total / limit) || 1
  const from = Math.min((page - 1) * limit + 1, total)
  const to = Math.min(page * limit, total)

  if (totalPages <= 1 && total === 0) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {t('pagination.showing', 'Showing')} {from} - {to} {t('pagination.of', 'of')} {total}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm text-slate-600 dark:text-slate-300">
          {t('pagination.page', 'Page')} {page} {t('pagination.of', 'of')} {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}