import { useState } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Edit, Trash2, User, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/shared/ui/feedback/skeleton'
import { Alert, AlertDescription } from '@/shared/ui'
import { Each, Show } from '@/shared/ui/layout/Render'
import { cn } from '@/shared/utils/cn'
import { useUser, useDeleteUser } from '@/domains/users/hooks/useUsers'
import { UserOverviewTab } from '@/domains/users/components/users/tabs/UserOverviewTab'
import { UserPermissionsTab } from '@/domains/users/components/users/tabs/UserPermissionsTab'
import { UserSessionsTab } from '@/domains/users/components/users/tabs/UserSessionsTab'
import { UserActivityTab } from '@/domains/users/components/users/tabs/UserActivityTab'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui'

type TabValue = 'overview' | 'permissions' | 'sessions' | 'activity'

const TABS: { value: TabValue; labelKey: string; fallback: string }[] = [
  { value: 'overview', labelKey: 'detail.tab_overview', fallback: 'Overview' },
  { value: 'permissions', labelKey: 'detail.tab_permissions', fallback: 'Permissions' },
  { value: 'sessions', labelKey: 'detail.tab_sessions', fallback: 'Sessions' },
  { value: 'activity', labelKey: 'detail.tab_activity', fallback: 'Activity' },
]

export function UserDetailPage() {
  const { t } = useTranslation(['users', 'common'])
  const navigate = useNavigate()
  const location = useLocation()

  // Extract ID from URL path (e.g., /admin/master-data/users/123)
  const match = location.pathname.match(/\/users\/([^/]+)(?:\/|$)/)
  const userId = match?.[1] ?? ''

  const [activeTab, setActiveTab] = useState<TabValue>('overview')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: user, isLoading, isError, error } = useUser(userId)
  const deleteMutation = useDeleteUser()

  const handleEdit = () => {
    if (!user) return
    void navigate({ to: '/admin/master-data/users/$id/edit', params: { id: user.eid || user.id.toString() } } as any)
  }

  const handleBack = () => {
    void navigate({ to: '/admin/master-data/users' } as any)
  }

  const handleDelete = () => {
    if (!user) return
    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        setShowDeleteDialog(false)
        void navigate({ to: '/admin/master-data/users' } as any)
      },
    })
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('detail.back_to_list', 'Back to users')}
        </button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : t('detail.load_error', 'Failed to load user')}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('detail.back_to_list', 'Back to users')}
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 p-6">
        <Show when={isLoading}>
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </Show>

        <Show when={!isLoading && !!user} fallback={null}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0">
                {user?.full_name?.charAt(0)?.toUpperCase() || user?.user_id.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {user?.full_name || user?.user_id}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
                  <User className="h-3.5 w-3.5" />
                  <span className="font-mono">{user?.user_id}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/30 transition-colors"
              >
                <Edit className="h-4 w-4" />
                {t('detail.edit_button', 'Edit')}
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-white/10 text-sm font-semibold rounded-xl transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {t('detail.delete_button', 'Delete')}
              </button>
            </div>
          </div>
        </Show>
      </div>

      {/* Tabs */}
      <Show when={!isLoading && !!user} fallback={null}>
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 p-2 flex gap-2">
            <Each of={TABS}>
              {(tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    activeTab === tab.value
                      ? 'bg-primary-500 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  {t(tab.labelKey, tab.fallback)}
                </button>
              )}
            </Each>
          </div>

          <div>
            <Show when={activeTab === 'overview'} fallback={null}>
              <UserOverviewTab user={user!} isLoading={false} />
            </Show>

            <Show when={activeTab === 'permissions'} fallback={null}>
              <UserPermissionsTab userId={userId} isStandalone />
            </Show>

            <Show when={activeTab === 'sessions'} fallback={null}>
              <UserSessionsTab userId={userId} />
            </Show>

            <Show when={activeTab === 'activity'} fallback={null}>
              <UserActivityTab userId={userId} />
            </Show>
          </div>
        </div>
      </Show>

      <Show when={isLoading}>
        <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Show>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('detail.delete_title', 'Delete User')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('detail.delete_confirm', 'Are you sure you want to delete this user? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:button.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : t('detail.delete_button', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
