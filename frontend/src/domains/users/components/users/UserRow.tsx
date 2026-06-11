import { useTranslation } from 'react-i18next'
import { Button, Badge } from '@/shared/ui'
import { TableCell, TableRow } from '@/shared/ui/data/table'
import { Show } from '@/shared/ui/layout/Render'
import {
  Pencil,
  Shield,
  History,
  Trash,
  Check,
  X,
  Clock,
} from 'lucide-react'
import type { IDbflpass } from '@/domains/users/types/user'

interface IUserRowProps {
  user: IDbflpass
  currentUserId?: string
  onEdit: (user: IDbflpass) => void
  onSessions: (user: IDbflpass) => void
  onPermissions: (user: IDbflpass) => void
  onDelete: (userId: string, fullName: string) => void
  onActivityLog: (user: IDbflpass) => void
  onToggleStatus: (user: IDbflpass) => void
}

export function UserRow({
  user,
  onEdit,
  onSessions,
  onPermissions,
  onDelete,
  onActivityLog,
  onToggleStatus,
}: IUserRowProps) {
  const { t } = useTranslation(['users', 'common'])

  return (
    <TableRow key={user.user_id}>
      {/* USER ID: Medium & Contrast */}
      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
        {user.user_id}
      </TableCell>

      {/* FULL NAME */}
      <TableCell>
        {user.full_name || '-'}
      </TableCell>

      {/* LEVEL: Standard Badge */}
      <TableCell>
        <Badge variant="outline">Lvl {user.tingkat || '0'}</Badge>
      </TableCell>

      {/* STATUS: Standard Badge */}
      <TableCell>
        <Badge variant={user.status === '1' ? 'success' : 'secondary'}>
          {user.status === '1' ? t('status_filter_active', 'Active') : t('status_filter_inactive', 'Inactive')}
        </Badge>
      </TableCell>

      {/* ACTIONS: Clean aligned ghost buttons matching MenuDataTable */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {/* Toggle Status Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${user.status === '1' ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-600 hover:text-emerald-700'}`}
            onClick={() => onToggleStatus(user)}
            title={user.status === '1' ? t('buttons.disable', 'Disable') : t('buttons.enable', 'Enable')}
          >
            <Show when={user.status === '1'} fallback={<Check className="h-4 w-4" />}>
              <X className="h-4 w-4" />
            </Show>
          </Button>

          {/* Permissions Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-slate-600"
            title={t('buttons.permissions', 'Permissions')}
            onClick={() => onPermissions(user)}
          >
            <Shield className="h-4 w-4" />
          </Button>

          {/* Sessions Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-teal-600 hover:text-teal-700"
            title={t('buttons.sessions', 'Active Sessions')}
            onClick={() => onSessions(user)}
          >
            <Clock className="h-4 w-4" />
          </Button>

          {/* Logs Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-cyan-600 hover:text-cyan-700"
            title={t('buttons.logs', 'Logs')}
            onClick={() => onActivityLog(user)}
          >
            <History className="h-4 w-4" />
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