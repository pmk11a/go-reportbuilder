import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Save } from 'lucide-react'
import { Button } from '@/shared/ui/overlay/button'
import { Input } from '@/shared/ui/form/input'
import { Card, CardContent } from '@/shared/ui/layout/card'
import { Alert, AlertDescription } from '@/shared/ui/feedback/alert'
import { Each } from '@/shared/ui/layout/Render'
import { UserFormActions } from '@/domains/users/components/users/form/UserFormActions'
import { useUserLevels } from '@/shared/hooks/useUserLevels'
import { useUserKinds } from '@/shared/hooks/useUserKinds'
import { useUserRelations } from '@/shared/hooks/useUserRelations'
import { useUserStatuses } from '@/shared/hooks/useUserStatuses'
import { useCompanies } from '@/shared/hooks/useCompanies'
import { useCreateUser, useUpdateUser } from '@/domains/users/hooks/useUsers'
import type { IUserDetail } from '@/domains/users/types'
import { apiErrorMessage } from '@/shared/utils/errorMapper'

export interface IUserFormValues {
  username: string
  fullname: string
  email: string
  phone: string
  id_company: string
  id_user_level: string
  id_user_kind: string
  id_user_relation: string
  id_user_status: string
}

const buildSchema = (t: (k: string) => string) =>
  z.object({
    username: z
      .string()
      .min(1, t('validation.required'))
      .min(3, 'Username must be at least 3 characters'),
    fullname: z.string().min(1, t('validation.required')),
    email: z
      .string()
      .min(1, t('validation.required'))
      .email(t('validation.email')),
    phone: z.string().optional().or(z.literal('')),
    id_company: z.string().min(1, t('validation.required')),
    id_user_level: z.string().min(1, t('validation.required')),
    id_user_kind: z.string().min(1, t('validation.required')),
    id_user_relation: z.string().min(1, t('validation.required')),
    id_user_status: z.string().min(1, t('validation.required')),
  })

export interface IUserFormProps {
  mode: 'create' | 'edit'
  user?: Partial<IUserDetail>
  onSuccess: (user: IUserDetail) => void
  onCancel: () => void
  submitLabel?: string
}

export const UserForm: React.FC<IUserFormProps> = ({
  mode,
  user,
  onSuccess,
  onCancel,
  submitLabel,
}) => {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  const levels = useUserLevels()
  const kinds = useUserKinds()
  const relations = useUserRelations()
  const statuses = useUserStatuses()
  const companies = useCompanies()

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()

  const schema = buildSchema(t)
  type TFormValues = z.infer<typeof schema>

  const form = useForm<TFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user?.username ?? '',
      fullname: user?.fullname ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      id_company: user?.id_company ?? '',
      id_user_level: user?.id_user_level ?? '',
      id_user_kind: user?.id_user_kind ?? '',
      id_user_relation: user?.id_user_relation ?? '',
      id_user_status: user?.id_user_status ?? '',
    },
  })

  // Keep form in sync when an edit-mode user loads asynchronously
  useEffect(() => {
    if (mode === 'edit' && user) {
      form.reset({
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone ?? '',
        id_company: user.id_company,
        id_user_level: user.id_user_level,
        id_user_kind: user.id_user_kind,
        id_user_relation: user.id_user_relation,
        id_user_status: user.id_user_status,
      })
    }
  }, [mode, user, form])

  const onSubmit = async (values: TFormValues) => {
    setError(null)
    try {
      const result =
        mode === 'create'
          ? await createMutation.mutateAsync(values)
          : await updateMutation.mutateAsync({ id: user!.id ?? 0, data: values })
      onSuccess(result as IUserDetail)
    } catch (err) {
      setError(apiErrorMessage(err, t('userManagement.form.saveError')))
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const defaultSubmitLabel = mode === 'create' ? t('common.create') : t('common.save')

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-medium">{t('userManagement.form.sections.account')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('userManagement.form.fields.username')}
              </label>
              <Input
                {...form.register('username')}
                disabled={mode === 'edit'}
                placeholder={t('userManagement.form.placeholders.username')}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('userManagement.form.fields.fullname')}
              </label>
              <Input
                {...form.register('fullname')}
                placeholder={t('userManagement.form.placeholders.fullname')}
              />
              {form.formState.errors.fullname && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.fullname.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('userManagement.form.fields.email')}
              </label>
              <Input
                type="email"
                {...form.register('email')}
                placeholder={t('userManagement.form.placeholders.email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('userManagement.form.fields.phone')}
              </label>
              <Input
                {...form.register('phone')}
                placeholder={t('userManagement.form.placeholders.phone')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-medium">{t('userManagement.form.sections.organization')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('userManagement.form.fields.company')}
              </label>
              <select
                {...form.register('id_company')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('common.select')}</option>
                <Each of={companies.data?.data || []}>
                  {(c: any) => <option key={c.eid} value={c.eid}>{c.name}</option>}
                </Each>
              </select>
              {form.formState.errors.id_company && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.id_company.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('userManagement.form.fields.level')}
              </label>
              <select
                {...form.register('id_user_level')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('common.select')}</option>
                <Each of={levels.data?.data || []}>
                  {(l: any) => <option key={l.eid} value={l.eid}>{l.name}</option>}
                </Each>
              </select>
              {form.formState.errors.id_user_level && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.id_user_level.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('userManagement.form.fields.kind')}
              </label>
              <select
                {...form.register('id_user_kind')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('common.select')}</option>
                <Each of={kinds.data?.data || []}>
                  {(k: any) => <option key={k.eid} value={k.eid}>{k.name}</option>}
                </Each>
              </select>
              {form.formState.errors.id_user_kind && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.id_user_kind.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('userManagement.form.fields.relation')}
              </label>
              <select
                {...form.register('id_user_relation')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('common.select')}</option>
                <Each of={relations.data?.data || []}>
                  {(r: any) => <option key={r.eid} value={r.eid}>{r.name}</option>}
                </Each>
              </select>
              {form.formState.errors.id_user_relation && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.id_user_relation.message}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">
                {t('userManagement.form.fields.status')}
              </label>
              <select
                {...form.register('id_user_status')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('common.select')}</option>
                <Each of={statuses.data?.data || []}>
                  {(s: any) => <option key={s.eid} value={s.eid}>{s.name}</option>}
                </Each>
              </select>
              {form.formState.errors.id_user_status && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.id_user_status.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <UserFormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel ?? defaultSubmitLabel}
        icon={<Save className="mr-2 h-4 w-4" />}
      />
    </form>
  )
}
