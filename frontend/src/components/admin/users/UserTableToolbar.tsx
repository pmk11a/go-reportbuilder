import { useTranslation } from 'react-i18next'
import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui'
import { Input } from '@/components/ui/form/input'
import { Search, RefreshCw, Plus } from 'lucide-react'

interface IUserTableToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  onAdd: () => void
  onRefresh: () => void
  isFetching: boolean
}

export function UserTableToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAdd,
  onRefresh,
  isFetching,
}: IUserTableToolbarProps) {
  const { t } = useTranslation(['users', 'common'])

  return (
    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
        {/* Separate Status Select Dropdown */}
        <div className="w-full sm:w-40 flex items-center">
          <Select
            value={statusFilter}
            onValueChange={onStatusFilterChange}
          >
            <SelectTrigger className="w-full h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm">
              <SelectValue placeholder={t('status_filter_all', 'All Status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('status_filter_all', 'All Status')}</SelectItem>
              <SelectItem value="1">{t('status_filter_active', 'Active')}</SelectItem>
              <SelectItem value="0">{t('status_filter_inactive', 'Inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Joined Search Input and Button Group */}
        <div className="flex w-full sm:w-auto items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('search_placeholder', 'Search user...')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 bg-white dark:bg-slate-950 rounded-r-none border-r-0 focus:z-10 focus:ring-secondary-500 text-sm"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-l-none rounded-r-xl h-9 px-6 font-semibold flex items-center justify-center"
          >
            {t('common.search', 'Search')}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Refresh')}
        </Button>
        <Button onClick={onAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('add_user', 'Tambah User')}
        </Button>
      </div>
    </div>
  )
}