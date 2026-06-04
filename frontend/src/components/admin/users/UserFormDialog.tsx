import React from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useUsers } from '@/hooks/useUsers'
import type { IDbflpass } from '@/types/user'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Spinner,
} from '@/components/ui'

interface IUserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: IDbflpass | null
}

export function UserFormDialog({ open, onOpenChange, user }: IUserFormDialogProps) {
  const { t } = useTranslation(['users', 'common'])
  const { useCreateUser, useUpdateUser } = useUsers()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()

  const isEdit = !!user

  const userSchema = z.object({
    username: z.string().min(3, t('validation.username_min', 'Username must be at least 3 characters')),
    full_name: z.string().min(1, t('validation.full_name_required', 'Full name is required')),
    role: z.enum(['admin', 'karyawan'] as const),
    password: isEdit
      ? z.string().optional()
      : z.string().min(6, t('validation.password_min', 'Password must be at least 6 characters')),
  })

  type FormValues = z.infer<typeof userSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      full_name: '',
      role: 'karyawan',
      password: '',
    },
  })

  React.useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          username: user.user_id || '',
          full_name: user.full_name || '',
          role: user.tingkat === '2' ? 'admin' : 'karyawan',
          password: '',
        })
      } else {
        form.reset({
          username: '',
          full_name: '',
          role: 'karyawan',
          password: '',
        })
      }
    }
  }, [open, user, form])

  const onSubmit = (values: FormValues) => {
    if (isEdit && user) {
      const editUserId = user.user_id
      updateMutation.mutate(
        {
          id: editUserId,
          data: {
            full_name: values.full_name,
            role: values.role,
            password: values.password,
          },
        },
        {
          onSuccess: () => onOpenChange(false),
        }
      )
    } else {
      createMutation.mutate(
        {
          username: values.username,
          password: values.password ?? '',
          full_name: values.full_name,
          role: values.role,
        },
        {
          onSuccess: () => onOpenChange(false),
        }
      )
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('edit_user', 'Edit User') : t('add_user', 'Add User')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('dialog.edit_description', 'Update user profile details below.')
              : t('dialog.add_description', 'Fill out the form below to create a new user.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog.full_name_label', 'Full Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog.username_label', 'Username')}</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} disabled={isEdit || isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog.role_label', 'System Role')}</FormLabel>
                  <Select
                    disabled={isPending}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="karyawan">{t('dialog.role_karyawan', 'Karyawan')}</SelectItem>
                      <SelectItem value="admin">{t('dialog.role_admin', 'Admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('dialog.password_label', 'Password')}
                    {isEdit && <span className="text-xs text-muted-foreground ml-1">({t('dialog.password_hint', 'leave blank to keep unchanged')})</span>}
                  </FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                {isEdit ? t('common.save', 'Save Changes') : t('common.create', 'Create User')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
