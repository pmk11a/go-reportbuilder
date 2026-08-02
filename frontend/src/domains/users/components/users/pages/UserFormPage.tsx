import type React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/ui/overlay/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/layout/card'
import { UserForm } from '@/domains/users/components/users/form/UserForm'
import { useUser } from '@/domains/users/hooks/useUsers'
import type { IDbflpass } from '@/domains/users/types/user'

export interface IUserFormPageProps {
  mode: 'create' | 'edit'
  userEid?: string
}

export const UserFormPage: React.FC<IUserFormPageProps> = ({ mode, userEid }) => {
  const { t } = useTranslation(['users', 'common'])
  const navigate = useNavigate()
  const isEdit = mode === 'edit'

  const userQuery = useUser(userEid ?? '', { enabled: isEdit && !!userEid })

// @ts-expect-error - unused variable
  const handleSuccess = (user: IDbflpass) => {
    navigate({ to: '/admin/master-data/users' })
  }

  const handleCancel = () => {
    if (isEdit && userEid) {
      navigate({ to: '/admin/master-data/users' })
    } else {
      navigate({ to: '/admin/master-data/users' })
    }
  }

  const title = isEdit ? t('users:edit_user', 'Edit User') : t('users:add_user', 'Add User')
  const subtitle = isEdit
    ? t('users:dialog.edit_description', 'Update user profile details below.')
    : t('users:dialog.add_description', 'Fill out the form below to create a new user.')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          aria-label={t('common.back', 'Back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {isEdit ? (
            userQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">{t('common.loading', 'Loading...')}</p>
            ) : userQuery.error ? (
              <p className="text-red-500 text-sm">{t('users:messages.error_loading', 'Failed to load user')}</p>
            ) : userQuery.data ? (
              <UserForm
                mode="edit"
                user={userQuery.data}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            ) : null
          ) : (
            <UserForm mode="create" onSuccess={handleSuccess} onCancel={handleCancel} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
