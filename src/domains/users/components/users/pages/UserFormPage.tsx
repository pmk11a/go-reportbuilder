import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/ui/overlay/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/layout/card'
import { UserForm } from '@/domains/users/components/users/form/UserForm'
import { useUser } from '@/domains/users/hooks/useUsers'
import type { IUserDetail } from '@/domains/users/types'

export const UserFormPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const isEdit = location.pathname.includes('/edit')

  // Extract ID from URL path for edit mode
  let userEid = ''
  if (isEdit) {
    const match = location.pathname.match(/\/users\/([^/]+)\/edit/)
    userEid = match?.[1] ?? ''
  }

  const userQuery = useUser(userEid ?? '', { enabled: isEdit && !!userEid })

  const handleSuccess = (user: IUserDetail) => {
    navigate({ to: '/admin/master-data/users/$id', params: { id: user.eid } } as any)
  }

  const handleCancel = () => {
    if (isEdit && userEid) {
      navigate({ to: '/admin/master-data/users/$id', params: { id: userEid } } as any)
    } else {
      navigate({ to: '/admin/master-data/users' } as any)
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
