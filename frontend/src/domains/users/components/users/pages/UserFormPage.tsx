import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/ui/overlay/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/layout/card'
import { UserForm } from '@/domains/users/components/users/form/UserForm'
import { useUser } from '@/domains/users/hooks/useUsers'
import type { IUserDetail } from '@/domains/users/types/user'

export interface IUserFormPageProps {
  mode: 'create' | 'edit'
  userEid?: string
}

export const UserFormPage: React.FC<IUserFormPageProps> = ({ mode, userEid }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'

  const userQuery = useUser(userEid ?? '', { enabled: isEdit && !!userEid })

  const handleSuccess = (user: IUserDetail) => {
    navigate({ to: '/admin/master-data/users/$eid', params: { eid: user.eid } })
  }

  const handleCancel = () => {
    if (isEdit && userEid) {
      navigate({ to: '/admin/master-data/users/$eid', params: { eid: userEid } })
    } else {
      navigate({ to: '/admin/master-data/users/' })
    }
  }

  const title = isEdit ? t('userManagement.edit.title') : t('userManagement.create.title')
  const subtitle = isEdit
    ? t('userManagement.edit.subtitle')
    : t('userManagement.create.subtitle')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          aria-label={t('common.back')}
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
              <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
            ) : userQuery.error ? (
              <p className="text-red-500 text-sm">{t('userManagement.detail.loadError')}</p>
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
