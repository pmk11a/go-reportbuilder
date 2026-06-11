import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Button, Badge } from '@/components/ui'
import { TableCell, TableRow } from '@/components/ui/data/table'
import { Show } from '@/components/ui/layout/Render'
import { Pencil, Trash, Check, X, ChevronRight } from 'lucide-react'
import type { IDbflpass } from '@/types/user'

interface IUserListRowProps {
  user: IDbflpass
  currentUserId?: string
  onRowClick: (user: IDbflpass) => void
  onEdit: (user: IDbflpass) => void
  onDelete: (userId: string, fullName: string) => void
  onToggleStatus: (user: IDbflpass) => void
}

/**
 * Single table row for a user. Clicks anywhere on the row navigate to the
 * user's detail page; the edit/delete/toggle buttons stop propagation so
 * they don't trigger the row-click handler.
 */
export function UserListRow({
  user,
  onRowClick,
  onEdit,
  onDelete,
  onToggleStatus,
}: IUserListRowProps) {
  const { t } = useTranslation(['users', 'common'])
  const navigate = useNavigate()

  return (
    <TableRow
      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
      onClick={() => onRowClick(user)}
    >
      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
        {user.user_id}
      </TableCell>
      <TableCell>{user.full_name || '-'}</TableCell>
      <TableCell>
        <Badge variant="outline">Lvl {user.tingkat || '0'}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={user.status === '1' ? 'success' : 'secondary'}>
          {user.status === '1' ? t('status_filter_active', 'Active') : t('status_filter_inactive', 'Inactive')}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${user.status === '1' ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-600 hover:text-emerald-700'}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleStatus(user)
            }}
            title={user.status === '1' ? t('buttons.disable', 'Disable') : t('buttons.enable', 'Enable')}
          >
            <Show when={user.status === '1'} fallback={<Check className="h-4 w-4" />}>
              <X className="h-4 w-4" />
            </Show>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(user)
            }}
            title={t('buttons.edit', 'Edit')}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(user.user_id, user.full_name || user.user_id)
            }}
            title={t('buttons.delete', 'Hapus')}
          >
            <Trash className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400"
            onClick={(e) => {
              e.stopPropagation()
              navigate({ to: '/admin/_layout/master-data/users/$id', params: { id: user.user_id } })
            }}
            title={t('buttons.detail', 'Detail')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
