import React, { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { IDbMenu } from '@/types/menu';
import { PMenuFormDialogProps } from '@/types/components'
import { useParentMenus, useCreateMenu, useUpdateMenu } from '@/hooks/useMenu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/overlay/dialog'
import { Button } from '@/components/ui/overlay/button'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/form/label'
import { SearchableSelect } from '@/components/ui/form/searchable-select'
import { Alert, AlertDescription } from '@/components/ui/feedback/alert'
import { icons } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import DynamicLucideIcon from '@/components/ui/LucideIcon'
import { useTranslation } from 'react-i18next'

export function MenuFormDialog(props: PMenuFormDialogProps) {
  const { isOpen, onClose, initialData } = props;
  const isEditing = !!initialData
  const { t } = useTranslation(['menu', 'common']);

  const menuSchema = useMemo(() => z.object({
    KODEMENU: z.string().min(1, t('validation.code_required')).max(25),
    Keterangan: z.string().min(1, t('validation.description_required')).max(500),
    L0: z.coerce.number().min(0, t('validation.level_min')),
    ACCESS: z.coerce.number().default(0),
    OL: z.coerce.number().default(0),
    TipeTrans: z.string().optional().default(''),
    Routename: z.string().nullable().optional(),
    Icon: z.string().max(50).default(''),
    PlatformMask: z.coerce.number().nullable().optional(),
    _parentCode: z.string().optional() // Virtual field for UI form
  }), [t]);

  type MenuFormValues = z.infer<typeof menuSchema>

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuSchema) as any,
    defaultValues: {
      KODEMENU: '',
      Keterangan: '',
      L0: 0,
      ACCESS: 0,
      OL: 0,
      TipeTrans: '',
      Routename: '',
      Icon: '',
      PlatformMask: 0,
      _parentCode: ''
    }
  })

  // Set default values when editing
  useEffect(() => {
    if (initialData) {
      const currentCode = initialData.KODEMENU ? initialData.KODEMENU.trim() : ''
      form.reset({
        ...initialData,
        KODEMENU: currentCode,
        TipeTrans: initialData.TipeTrans || '',
        Routename: initialData.Routename || '',
        PlatformMask: initialData.PlatformMask || 0,
        _parentCode: initialData.L0 > 0 ? currentCode.substring(0, 2) : ''
      })
    } else {
      form.reset()
    }
  }, [initialData, form])

  const watchL0 = form.watch('L0')
  const watchParentCode = form.watch('_parentCode')
  const watchIcon = form.watch('Icon')
  const watchKodeMenu = form.watch('KODEMENU')

  // Fetch Parent Menus when Level (L0) > 0
  const { data: parentResponse, isLoading: isLoadingParents } = useParentMenus(watchL0)

  const parentOptions = useMemo(() => {
    if (!parentResponse?.data) return []
    return parentResponse.data.map(menu => ({
      value: menu.KODEMENU ? menu.KODEMENU.trim() : '',
      label: `${menu.KODEMENU ? menu.KODEMENU.trim() : ''} - ${menu.Keterangan ? menu.Keterangan.trim() : ''}`
    }))
  }, [parentResponse])

  // Icon Options from Lucide with preview
  const iconOptions = useMemo(() => {
    return Object.keys(icons).map(key => {
      const IconComponent = (icons as any)[key];
      return {
        value: key,
        label: key,
        icon: <IconComponent className="h-4 w-4 text-current" />
      }
    })
  }, [])

  // Mutations
  const createMutation = useCreateMenu(onClose)
  const updateMutation = useUpdateMenu(initialData?.KODEMENU || '', onClose)

  const onSubmit = (values: MenuFormValues) => {
    const payload: IDbMenu = {
      KODEMENU: values.KODEMENU,
      Keterangan: values.Keterangan,
      L0: values.L0,
      ACCESS: values.ACCESS,
      OL: values.OL,
      TipeTrans: values.TipeTrans || '',
      Routename: values.Routename || '',
      Icon: values.Icon,
      PlatformMask: values.PlatformMask || 0
    }

    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  // Handle auto-prefixing KODEMENU when a parent is selected (Only on Create)
  useEffect(() => {
    if (!isEditing && watchL0 > 0 && watchParentCode) {
      if (!watchKodeMenu.startsWith(watchParentCode)) {
        form.setValue('KODEMENU', watchParentCode)
      }
    }
  }, [watchParentCode, watchL0, isEditing, form, watchKodeMenu])

  const isLoading = createMutation.isPending || updateMutation.isPending
  const mutationError = (createMutation.error || updateMutation.error) as any

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? t('edit_menu') : t('add_new_menu')}
          </DialogTitle>
          <DialogDescription className="hidden">
            {t('form_desc', { action: isEditing ? t('form_desc_edit') : t('form_desc_add') })}
          </DialogDescription>
        </DialogHeader>

        {mutationError && (
          <Alert className="mt-4 border-red-200 bg-red-50/80 dark:bg-red-900/20">
            <AlertDescription className="text-red-800 dark:text-red-200 text-sm font-medium">
              {mutationError.message || mutationError.rawMsg || t('save_failed')}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Level Menu */}
            <div className="space-y-2">
              <Label htmlFor="L0">{t('level')}</Label>
              <Input
                id="L0"
                type="number"
                min="0"
                disabled={isEditing}
                {...form.register('L0')}
              />
              {form.formState.errors.L0 && (
                <p className="text-xs text-red-500">{form.formState.errors.L0.message}</p>
              )}
            </div>

            {/* Parent Menu (Muncul jika L0 > 0) */}
            {watchL0 > 0 && (
              <div className="space-y-2">
                <Label>{t('parent')}</Label>
                <Controller
                  name="_parentCode"
                  control={form.control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={parentOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={isLoadingParents ? t('parent_loading') : t('parent_placeholder')}
                      disabled={isEditing || isLoadingParents}
                    />
                  )}
                />
              </div>
            )}

            {/* Kode Menu */}
            <div className="space-y-2">
              <Label htmlFor="KODEMENU">{t('code')}</Label>
              <Input
                id="KODEMENU"
                placeholder={watchParentCode ? `${watchParentCode}01` : 'M01'}
                disabled={isEditing}
                {...form.register('KODEMENU')}
              />
              {form.formState.errors.KODEMENU && (
                <p className="text-xs text-red-500">{form.formState.errors.KODEMENU.message}</p>
              )}
            </div>

            {/* Keterangan */}
            <div className="space-y-2">
              <Label htmlFor="Keterangan">{t('description')}</Label>
              <Input
                id="Keterangan"
                placeholder="Dashboard"
                {...form.register('Keterangan')}
              />
              {form.formState.errors.Keterangan && (
                <p className="text-xs text-red-500">{form.formState.errors.Keterangan.message}</p>
              )}
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>{t('icon')}</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Controller
                    name="Icon"
                    control={form.control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={iconOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={t('icon_search')}
                      />
                    )}
                  />
                </div>
                {watchIcon && (
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-800/50">
                    <DynamicLucideIcon name={watchIcon} className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Routename */}
            <div className="space-y-2">
              <Label htmlFor="Routename">{t('routename')}</Label>
              <Input
                id="Routename"
                placeholder="/admin/dashboard"
                {...form.register('Routename')}
              />
            </div>

            {/* Tipe Transaksi */}
            <div className="space-y-2">
              <Label htmlFor="TipeTrans">{t('tipe_trans')}</Label>
              <Input
                id="TipeTrans"
                placeholder="TRX01"
                {...form.register('TipeTrans')}
              />
            </div>
            
            {/* Legacy & Auth Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ACCESS">{t('access')}</Label>
                <Input
                  id="ACCESS"
                  type="number"
                  {...form.register('ACCESS')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="OL">{t('ol')}</Label>
                <Input
                  id="OL"
                  type="number"
                  {...form.register('OL')}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
