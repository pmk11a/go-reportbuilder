import type React from 'react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Save } from 'lucide-react'
import { Input } from '@/shared/ui/form/input'
import { PasswordInput } from '@/shared/ui/form/password-input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/form/select'
import { Card, CardContent } from '@/shared/ui/layout/card'
import { Alert, AlertDescription } from '@/shared/ui/feedback/alert'
import { UserFormActions } from '@/domains/users/components/users/form/UserFormActions'
import { useCreateUser, useUpdateUser } from '@/domains/users/hooks/useUsers'
import { apiErrorMessage } from '@/shared/utils/errorMapper'
import type { IDbflpass, ICreateUserPayload, IUpdateUserPayload } from '@/domains/users/types/user'

type TUserRole = 'admin' | 'karyawan'

export interface IUserFormProps {
  mode: 'create' | 'edit'
  user?: IDbflpass
  onSuccess: (user: IDbflpass) => void
  onCancel: () => void
  submitLabel?: string
}

const buildSchema = (mode: 'create' | 'edit', t: (key: string, fallback: string) => string) =>
  z.object({
    username: z
      .string()
      .min(3, t('validation.username_min', 'Username must be at least 3 characters')),
    full_name: z
      .string()
      .min(1, t('validation.full_name_required', 'Full name is required')),
    role: z.enum(['admin', 'karyawan']),
    status: z.enum(['0', '1']),
    password: mode === 'create'
      ? z.string().min(6, t('validation.password_min', 'Password must be at least 6 characters'))
      : z
          .string()
          .optional()
          .refine((val) => !val || val.length >= 6, {
            message: t('validation.password_min', 'Password must be at least 6 characters'),
          }),
  })

export const UserForm: React.FC<IUserFormProps> = ({
  mode,
  user,
  onSuccess,
  onCancel,
  submitLabel,
}) => {
  const { t } = useTranslation(['users', 'common'])
  const [error, setError] = useState<string | null>(null)

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()

  const schema = buildSchema(mode, t)
  type TFormValues = z.infer<typeof schema>

  const form = useForm<TFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user?.user_id ?? '',
      full_name: user?.full_name ?? '',
      role: user?.tingkat === '2' ? 'admin' : 'karyawan',
      status: user?.status === '0' ? '0' : '1',
      password: '',
    },
  })

  // Keep form in sync when an edit-mode user loads asynchronously
  useEffect(() => {
    if (mode === 'edit' && user) {
      form.reset({
        username: user.user_id ?? '',
        full_name: user.full_name ?? '',
        role: user.tingkat === '2' ? 'admin' : 'karyawan',
        status: user.status === '0' ? '0' : '1',
        password: '',
      })
    }
  }, [mode, user, form])

  const onSubmit = async (values: TFormValues) => {
    setError(null)
    try {
      if (mode === 'create') {
        const payload: ICreateUserPayload = {
          username: values.username,
          password: values.password ?? '',
          full_name: values.full_name,
          role: values.role as TUserRole,
        }
        const result = await createMutation.mutateAsync(payload)
        onSuccess(result as IDbflpass)
      } else {
        const payload: IUpdateUserPayload = {
          full_name: values.full_name,
          role: values.role as TUserRole,
          status: values.status,
          ...(values.password && { password: values.password }),
        }
        const result = await updateMutation.mutateAsync({ id: user!.user_id, data: payload })
        onSuccess(result as IDbflpass)
      }
    } catch (err) {
      setError(apiErrorMessage(err, t('messages.create_failed', 'Failed to save user')))
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const defaultSubmitLabel = mode === 'create' ? t('common.create', 'Create') : t('common.save', 'Save')

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('dialog.username_label', 'Username')}
              </label>
              <Input
                {...form.register('username')}
                disabled={mode === 'edit'}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('dialog.full_name_label', 'Full Name')}
              </label>
              <Input {...form.register('full_name')} />
              {form.formState.errors.full_name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('dialog.role_label', 'System Role')}
              </label>
              <Select
                value={form.watch('role')}
                onValueChange={(v) => form.setValue('role', v as TUserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('dialog.role_admin', 'Admin')}</SelectItem>
                  <SelectItem value="karyawan">{t('dialog.role_karyawan', 'Karyawan / Employee')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('fields.status', 'STATUS')}
              </label>
              <Select
                value={form.watch('status')}
                onValueChange={(v) => form.setValue('status', v as '0' | '1')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('status_filter_active', 'Active')}</SelectItem>
                  <SelectItem value="0">{t('status_filter_inactive', 'Inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">
                {t('dialog.password_label', 'Password')}
              </label>
              <PasswordInput {...form.register('password')} />
              {mode === 'edit' && (
                <p className="text-xs text-muted-foreground">
                  {t('dialog.password_hint', 'leave blank to keep unchanged')}
                </p>
              )}
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
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
