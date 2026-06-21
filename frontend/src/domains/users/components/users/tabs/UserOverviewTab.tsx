import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { id, enUS } from 'date-fns/locale'
import { Skeleton } from '@/shared/ui/feedback/skeleton'
import { Badge } from '@/shared/ui'
import { User, IdCard, Shield, Power, Calendar } from 'lucide-react'
import type { IDbflpass } from '@/domains/users/types/user'

interface IUserOverviewTabProps {
  user: IDbflpass
  isLoading?: boolean
}

/**
 * UserOverviewTab displays basic user information in a card layout.
 */
export function UserOverviewTab({ user, isLoading }: IUserOverviewTabProps) {
  const { t, i18n } = useTranslation(['users', 'common'])
  const dateLocale = i18n.language === 'id' ? id : enUS

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 p-6 space-y-6">
        <div className="flex items-start gap-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  const roleLabel = user.tingkat === '2' ? t('dialog.role_admin', 'Admin') : t('dialog.role_karyawan', 'Karyawan / Employee')

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 p-6">
      {/* User Avatar and Basic Info */}
      <div className="flex items-start gap-6 mb-8">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {user.full_name?.charAt(0)?.toUpperCase() || user.user_id.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {user.full_name || user.user_id}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={user.status === '1' ? 'success' : 'secondary'}>
              {user.status === '1' ? t('status_filter_active', 'Active') : t('status_filter_inactive', 'Inactive')}
            </Badge>
            <Badge variant="outline">{roleLabel}</Badge>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User ID */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
          <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('fields.user_id', 'USER ID')}
            </p>
            <p className="text-base font-mono font-semibold text-slate-900 dark:text-white mt-1">
              {user.user_id}
            </p>
          </div>
        </div>

        {/* Full Name */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <IdCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('fields.full_name', 'FULL NAME')}
            </p>
            <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
              {user.full_name || '-'}
            </p>
          </div>
        </div>

        {/* Role */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('dialog.role_label', 'System Role')}
            </p>
            <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
          <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Power className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('fields.status', 'STATUS')}
            </p>
            <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
              {user.status === '1' ? t('status_filter_active', 'Active') : t('status_filter_inactive', 'Inactive')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}