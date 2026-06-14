import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui'
import { Input } from '@/shared/ui/form/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/data/table'
import { Skeleton } from '@/shared/ui/feedback/skeleton'
import { Each, Show } from '@/shared/ui/layout/Render'
import { useUsers } from '@/domains/users/hooks/useUsers'
import { usePagination } from '@/shared/hooks/usePagination'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useAuth } from '@/domains/auth/hooks/use-auth'
import { useToast } from '@/shared/hooks/use-toast'
import { DeleteConfirmationDialog } from '@/shared/ui'
import { Search, RefreshCw, Plus, Pencil, Trash, Check, X } from 'lucide-react'
import type { IDbflpass } from '@/domains/users/types'

/**
 * UsersListPage for the /admin/master-data/users list page.
 * Row click navigates to detail page; action buttons are available.
 */
export function UsersListPage() {
  const { t } = useTranslation(['users', 'common'])
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const { useUsersList, useDeleteUser, useUpdateUser } = useUsers()

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteUserName, setDeleteUserName] = useState<string>('')

  const { page, setPage, limit } = usePagination(10)

  // Reset page when search term or status changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, setPage])

  // Fetch users list
  const { data: response, isFetching, isError } = useUsersList(
    page,
    limit,
    debouncedSearch,
    statusFilter === 'all' ? '' : statusFilter
  )

  const deleteMutation = useDeleteUser()
  const updateMutation = useUpdateUser()

  // Extract arrays and pagination data from the Go API wrapper structure
  const users = response?.data?.data || []
  const pagination = response?.data?.pagination || { current_page: 1, last_page: 1, total: 0, per_page: 10 }
  const total = pagination.total || 0
  const currentPage = pagination.current_page || 1

  // Action handlers
  const handleRowClick = (user: IDbflpass) => {
    navigate({ to: '/admin/master-data/users/$id', params: { id: user.user_id } })
  }

  const handleEdit = (user: IDbflpass) => {
    navigate({ to: '/admin/master-data/users/$id/edit', params: { id: user.user_id } })
  }

  const handleDelete = (userId: string, fullName: string) => {
    if (currentUser?.username === userId || currentUser?.user_id === userId) {
      toast({
        title: t('common.error', 'Error'),
        description: t('messages.delete_self_error', 'You cannot delete your own account'),
        variant: 'destructive',
      })
      return
    }
    setDeleteUserId(userId)
    setDeleteUserName(fullName)
  }

  const confirmDelete = () => {
    if (!deleteUserId) return
    deleteMutation.mutate(deleteUserId, {
      onSuccess: () => {
        setDeleteUserId(null)
      },
    })
  }

  const handleToggleStatus = (user: IDbflpass) => {
    const newStatus = user.status === '1' ? '0' : '1'
    updateMutation.mutate(
      {
        id: user.user_id,
        data: {
          username: user.uid ?? '',
          fullname: user.full_name ?? '',
          email: '',
          phone: '',
          id_company: '',
          id_user_level: '',
          id_user_kind: '',
          id_user_relation: '',
          id_user_status: newStatus,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: t('common.success', 'Success'),
            description: t('messages.status_updated', 'User status updated successfully'),
            variant: 'success',
          })
        },
        onError: () => {
          toast({
            title: t('common.error', 'Error'),
            description: t('messages.status_update_failed', 'Failed to update user status'),
            variant: 'destructive',
          })
        },
      }
    )
  }

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden">
      {/* Toolbar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
          {/* Status Select Dropdown */}
          <div className="w-full sm:w-40 flex items-center">
            <Select value={statusFilter} onValueChange={(val: string) => { setStatusFilter(val); setPage(1) }}>
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

          {/* Search Input */}
          <div className="flex w-full sm:w-auto items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t('search_placeholder', 'Search user...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-white dark:bg-slate-950 rounded-r-none border-r-0 focus:z-10 focus:ring-secondary-500 text-sm"
              />
            </div>
            <Button variant="secondary" size="sm" className="rounded-l-none rounded-r-xl h-9 px-6 font-semibold flex items-center justify-center">
              {t('common.search', 'Search')}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Refresh')}
          </Button>
          <Button onClick={() => navigate({ to: '/admin/master-data/users/new' } as any)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t('add_user', 'Tambah User')}
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('fields.user_id', 'USER ID')}</TableHead>
              <TableHead>{t('fields.full_name', 'FULL NAME')}</TableHead>
              <TableHead>{t('fields.level', 'LEVEL')}</TableHead>
              <TableHead>{t('fields.status', 'STATUS')}</TableHead>
              <TableHead className="text-right">{t('fields.actions', 'ACTIONS')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show
              when={isFetching && users.length === 0}
              fallback={
                <Show
                  when={isError}
                  fallback={
                    <Show
                      when={users.length === 0}
                      fallback={
                        <Each of={users}>
                          {(user: IDbflpass) => (
                            <UserListRow
                              key={user.user_id}
                              user={user}
                              currentUserId={currentUser?.user_id}
                              onRowClick={handleRowClick}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onToggleStatus={handleToggleStatus}
                            />
                          )}
                        </Each>
                      }
                    >
                      <TableRow>
                        <TableCell colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          {t('messages.empty', 'No users found')}
                        </TableCell>
                      </TableRow>
                    </Show>
                  }
                >
                  <TableRow>
                    <TableCell colSpan={5} className="px-4 py-8 text-center text-red-500 font-medium">
                      {t('messages.error_loading', 'Error loading users')}
                    </TableCell>
                  </TableRow>
                </Show>
              }
            >
              <Each of={Array.from({ length: limit })}>
                {(_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Each>
            </Show>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {t('pagination.showing', 'Showing')} {((currentPage - 1) * limit) + 1} {t('pagination.to', 'to')} {Math.min(currentPage * limit, total)} {t('pagination.of', 'of')} {total} {t('pagination.entries', 'entries')}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1 || isFetching}>
            {t('common.previous', 'Previous')}
          </Button>
          <span className="text-sm text-slate-500 dark:text-slate-400 px-2">
            {currentPage} / {pagination.last_page}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pagination.last_page || isFetching}>
            {t('common.next', 'Next')}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        onConfirm={confirmDelete}
        itemName={deleteUserName}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}

/**
 * Single user row for list page.
 * Clicking a row navigates to detail page; action buttons perform specific actions.
 */
interface IUserListRowProps {
  user: IDbflpass
  currentUserId?: string
  onRowClick: (user: IDbflpass) => void
  onEdit: (user: IDbflpass) => void
  onDelete: (userId: string, fullName: string) => void
  onToggleStatus: (user: IDbflpass) => void
}

function UserListRow({
  user,
  currentUserId,
  onRowClick,
  onEdit,
  onDelete,
  onToggleStatus,
}: IUserListRowProps) {
  const { t } = useTranslation(['users', 'common'])

  return (
    <TableRow
      key={user.user_id}
      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      onClick={() => onRowClick(user)}
    >
      {/* USER ID */}
      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
        {user.user_id}
      </TableCell>

      {/* FULL NAME */}
      <TableCell>
        {user.full_name || '-'}
      </TableCell>

      {/* LEVEL */}
      <TableCell>
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          Lvl {user.tingkat || '0'}
        </span>
      </TableCell>

      {/* STATUS */}
      <TableCell>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
          user.status === '1'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        }`}>
          {user.status === '1' ? t('status_filter_active', 'Active') : t('status_filter_inactive', 'Inactive')}
        </span>
      </TableCell>

      {/* ACTIONS */}
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          {/* Toggle Status Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${user.status === '1' ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-600 hover:text-emerald-700'}`}
            onClick={() => onToggleStatus(user)}
            title={user.status === '1' ? t('buttons.disable', 'Disable') : t('buttons.enable', 'Enable')}
          >
            {user.status === '1' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </Button>

          {/* Edit Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700"
            onClick={() => onEdit(user)}
            title={t('buttons.edit', 'Edit')}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700"
            onClick={() => onDelete(user.user_id, user.full_name || user.user_id)}
            title={t('buttons.delete', 'Hapus')}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
