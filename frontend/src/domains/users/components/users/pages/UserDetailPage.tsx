import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Edit, Trash2, User, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/shared/ui/feedback/skeleton'
import { Alert, AlertDescription, Tabs } from '@/shared/ui'
import { Show } from '@/shared/ui/layout/Render'
import { useUserById } from '@/domains/users/hooks/useUserById'
import { useDeleteUser } from '@/domains/users/hooks/useUsers'
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
  DeleteConfirmationDialog,
} from '@/shared/ui'

interface IUserDetailPageProps {
  userId: string
}

type TabValue = 'overview' | 'permissions' | 'sessions' | 'activity'

export function UserDetailPage({ userId }: IUserDetailPageProps) {
  const { t } = useTranslation(['users', 'common'])
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabValue>('overview')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: user, isLoading, isError, error, refetch } = useUserById(userId)
  const deleteMutation = useDeleteUser()

  const handleEdit = () => {
    if (!user) return
    void navigate({ to: '/admin/master-data/users/$id/edit', params: { id: user.user_id } })
  }

  const handleBack = () => {
    void navigate({ to: '/admin/master-data/users' })
  }

  const handleDeleteConfirm = () => {
    if (!user) return
    deleteMutation.mutate(user.user_id, {
      onSuccess: () => {
        setShowDeleteDialog(false)
        void navigate({ to: '/admin/master-data/users' })
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
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 p-6">
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

        <Show when={!isLoading && !!user}>
          {() => user ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-14 w-14 rounded-full bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0">
                  {user.full_name?.charAt(0)?.toUpperCase() || user.user_id.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                    {user.full_name || user.user_id}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
                    <User className="h-3.5 w-3.5" />
                    <span className="font-mono">{user.user_id}</span>
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
          ) : null}
        </Show>
      </div>

      {/* Tabs */}
      <Show when={!isLoading && !!user}>
        {() => (
          <Tabs
            defaultValue={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            tabs={[
              {
                value: 'overview',
                label: t('detail.tab_overview', 'Overview'),
                content: <UserOverviewTab user={user!} isLoading={false} />,
              },
              {
                value: 'permissions',
                label: t('detail.tab_permissions', 'Permissions'),
                content: <UserPermissionsTab userId={userId} isStandalone />,
              },
              {
                value: 'sessions',
                label: t('detail.tab_sessions', 'Sessions'),
                content: <UserSessionsTab userId={userId} />,
              },
              {
                value: 'activity',
                label: t('detail.tab_activity', 'Activity'),
                content: <UserActivityTab userId={userId} />,
              },
            ]}
          />
        )}
      </Show>

      <Show when={isLoading}>
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 p-6 space-y-4">
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
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('detail.delete_title', 'Delete User')}
        description={t('detail.delete_confirm', 'Are you sure you want to delete this user? This action cannot be undone.')}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
