import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUsers } from '@/hooks/useUsers'
import type { IUserPermission, IUserCoaAccess } from '@/types/user'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Checkbox,
  Skeleton,
  Tabs,
} from '@/components/ui'
import { Each, Show } from '@/components/ui/layout/Render'

interface IUserPermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: { user_id?: string; id?: string; full_name?: string } | null
}

type TPermissionTab = 'menu' | 'report' | 'coa'

export function UserPermissionsDialog({
  open,
  onOpenChange,
  user,
}: IUserPermissionsDialogProps) {
  const { t } = useTranslation(['users', 'common'])
  const {
    useUserMenuPermissions,
    useUserReportPermissions,
    useUserCoaAccess,
    useUpdateUserPermissions,
  } = useUsers()

  const userId = user?.user_id || user?.id || ''
  const [activeTab, setActiveTab] = useState<TPermissionTab>('menu')

  // ─── Per-tab queries: each only fires the first time its tab becomes active ───
  // Once loaded, the 10-min staleTime keeps the cache hot — switching back
  // and forth between tabs no longer hits the network.
  const {
    data: menuData,
    isLoading: isMenuLoading,
  } = useUserMenuPermissions(userId, { enabled: open && activeTab === 'menu' })

  const {
    data: reportData,
    isLoading: isReportLoading,
  } = useUserReportPermissions(userId, { enabled: open && activeTab === 'report' })

  const {
    data: coaData,
    isLoading: isCoaLoading,
  } = useUserCoaAccess(userId, { enabled: open && activeTab === 'coa' })

  const updateMutation = useUpdateUserPermissions()

  const [menuList, setMenuList] = useState<IUserPermission[]>([])
  const [reportList, setReportList] = useState<IUserPermission[]>([])
  const [coaList, setCoaList] = useState<IUserCoaAccess[]>([])

  // Hydrate local edit state when each tab's query resolves.
  useEffect(() => {
    if (menuData) setMenuList(menuData)
  }, [menuData])

  useEffect(() => {
    if (reportData) setReportList(reportData)
  }, [reportData])

  useEffect(() => {
    if (coaData) setCoaList(coaData)
  }, [coaData])

  // Reset all local edit state when dialog closes.
  useEffect(() => {
    if (!open) {
      setMenuList([])
      setReportList([])
      setCoaList([])
      setActiveTab('menu')
    }
  }, [open])

  const handlePermissionCheckbox = (
    type: 'menu' | 'report',
    index: number,
    field: 'checked' | 'aktif' | 'has_access',
    value: boolean
  ) => {
    const numericVal = value ? 1 : 0
    const setter = type === 'menu' ? setMenuList : setReportList
    const list = type === 'menu' ? menuList : reportList
    const updated = [...list]
    updated[index] = { ...updated[index], [field]: numericVal }
    // Auto-check visibility when enabling
    if (field === 'aktif' && numericVal === 1) {
      updated[index].checked = 1
    }
    setter(updated)
  }

  const handleGranularPermissionToggle = (
    type: 'menu' | 'report',
    index: number,
    field: 'is_create' | 'is_update' | 'is_delete' | 'is_print' | 'is_export' | 'is_approve_1' | 'is_approve_2' | 'is_approve_3' | 'is_approve_4' | 'is_approve_5',
    value: boolean
  ) => {
    const numericVal = value ? 1 : 0
    const setter = type === 'menu' ? setMenuList : setReportList
    const list = type === 'menu' ? menuList : reportList
    const updated = [...list]
    updated[index] = { ...updated[index], [field]: numericVal }
    setter(updated)
  }

  const handleCoaToggle = (index: number, value: boolean) => {
    const updated = [...coaList]
    updated[index] = { ...updated[index], checked: value ? 1 : 0 }
    setCoaList(updated)
  }

  const handleSave = () => {
    if (!userId) return
    updateMutation.mutate(
      {
        id: userId,
        data: { menu: menuList, report: reportList, coa: coaList },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    )
  }

  const isPending = updateMutation.isPending
  const isAnyLoading = isMenuLoading || isReportLoading || isCoaLoading

  // ─── Skeleton loader for table rows ───
  const renderSkeletonRows = (cols: number, rows = 6) => (
    <Each of={Array.from({ length: rows })}>
      {(_, i) => (
        <TableRow key={`sk-${i}`}>
          <Each of={Array.from({ length: cols })}>
            {(_, j) => (
              <TableCell key={j}>
                <Skeleton className="h-5 w-full" />
              </TableCell>
            )}
          </Each>
        </TableRow>
      )}
    </Each>
  )

  // ─── Menu / Report permission table with granular controls ───
  const renderPermissionTable = (
    type: 'menu' | 'report',
    data: IUserPermission[],
    isLoading: boolean,
  ) => {
    const emptyKey = type === 'menu' ? 'permissions.no_menus' : 'permissions.no_reports'
    return (
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="min-w-[200px]">{t('permissions.fields.menu_name')}</TableHead>
                <TableHead className="w-12 text-center text-xs" aria-label={t('permissions.fields.read')}>📖</TableHead>
                <TableHead className="w-12 text-center text-xs" aria-label={t('permissions.fields.create')}>➕</TableHead>
                <TableHead className="w-12 text-center text-xs" aria-label={t('permissions.fields.update')}>✏️</TableHead>
                <TableHead className="w-12 text-center text-xs" aria-label={t('permissions.fields.delete')}>🗑️</TableHead>
                <TableHead className="w-12 text-center text-xs" aria-label={t('permissions.fields.print')}>🖨️</TableHead>
                <TableHead className="w-12 text-center text-xs" aria-label={t('permissions.fields.export')}>📤</TableHead>
                <TableHead className="w-12 text-center text-xs" aria-label={t('permissions.fields.approve_1')}>✓1</TableHead>
                <TableHead className="w-12 text-center text-xs" aria-label={t('permissions.fields.approve_2')}>✓2</TableHead>
                <TableHead className="w-12 text-center text-xs" aria-label={t('permissions.fields.approve_3')}>✓3</TableHead>
                <TableHead className="w-12 text-center text-xs" aria-label={t('permissions.fields.approve_4')}>✓4</TableHead>
                <TableHead className="w-12 text-center text-xs" aria-label={t('permissions.fields.approve_5')}>✓5</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Show when={isLoading} fallback={
                <Show when={data.length === 0} fallback={
                  <Each of={data}>
                    {(item: IUserPermission, index: number) => {
                      const indentClass =
                        item.l3 > 0 ? 'pl-14' :
                        item.l2 > 0 ? 'pl-10' :
                        item.l1 > 0 ? 'pl-6' :
                        'pl-2 font-semibold text-slate-800 dark:text-slate-100'
                      return (
                        <TableRow key={item.kodemenu} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <TableCell className={indentClass}>
                            <div>
                              <span>{item.keterangan}</span>
                              <span className="text-xs text-slate-400 ml-2 font-mono">({item.kodemenu})</span>
                            </div>
                          </TableCell>
                          {/* Read - checked (visibility) toggle. Bug fix (TASK-009): was incorrectly wired to is_create. */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={((item.has_access ?? item.checked ?? 0) === 1)}
                                onChange={(e) => handlePermissionCheckbox(type, index, 'checked', e.target.checked)}
                                disabled={isPending}
                                title={t('permissions.fields.read')}
                                aria-label={t('permissions.fields.read')}
                              />
                            </div>
                          </TableCell>
                          {/* Create - is_create */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={(item.is_create ?? 0) === 1}
                                onChange={(e) => handleGranularPermissionToggle(type, index, 'is_create', e.target.checked)}
                                disabled={isPending}
                                title={t('permissions.fields.create')}
                                aria-label={t('permissions.fields.create')}
                              />
                            </div>
                          </TableCell>
                          {/* Update - is_update */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={(item.is_update ?? 0) === 1}
                                onChange={(e) => handleGranularPermissionToggle(type, index, 'is_update', e.target.checked)}
                                disabled={isPending}
                                title={t('permissions.fields.update')}
                                aria-label={t('permissions.fields.update')}
                              />
                            </div>
                          </TableCell>
                          {/* Delete - is_delete */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={(item.is_delete ?? 0) === 1}
                                onChange={(e) => handleGranularPermissionToggle(type, index, 'is_delete', e.target.checked)}
                                disabled={isPending}
                                title={t('permissions.fields.delete')}
                                aria-label={t('permissions.fields.delete')}
                              />
                            </div>
                          </TableCell>
                          {/* Print - is_print */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={(item.is_print ?? 0) === 1}
                                onChange={(e) => handleGranularPermissionToggle(type, index, 'is_print', e.target.checked)}
                                disabled={isPending}
                                title={t('permissions.fields.print')}
                                aria-label={t('permissions.fields.print')}
                              />
                            </div>
                          </TableCell>
                          {/* Export - is_export */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={(item.is_export ?? 0) === 1}
                                onChange={(e) => handleGranularPermissionToggle(type, index, 'is_export', e.target.checked)}
                                disabled={isPending}
                                title={t('permissions.fields.export')}
                                aria-label={t('permissions.fields.export')}
                              />
                            </div>
                          </TableCell>
                          {/* Approval 1..5 */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={(item.is_approve_1 ?? 0) === 1}
                                onChange={(e) => handleGranularPermissionToggle(type, index, 'is_approve_1', e.target.checked)}
                                disabled={isPending}
                                title={t('permissions.fields.approve_1')}
                                aria-label={t('permissions.fields.approve_1')}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={(item.is_approve_2 ?? 0) === 1}
                                onChange={(e) => handleGranularPermissionToggle(type, index, 'is_approve_2', e.target.checked)}
                                disabled={isPending}
                                title={t('permissions.fields.approve_2')}
                                aria-label={t('permissions.fields.approve_2')}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={(item.is_approve_3 ?? 0) === 1}
                                onChange={(e) => handleGranularPermissionToggle(type, index, 'is_approve_3', e.target.checked)}
                                disabled={isPending}
                                title={t('permissions.fields.approve_3')}
                                aria-label={t('permissions.fields.approve_3')}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={(item.is_approve_4 ?? 0) === 1}
                                onChange={(e) => handleGranularPermissionToggle(type, index, 'is_approve_4', e.target.checked)}
                                disabled={isPending}
                                title={t('permissions.fields.approve_4')}
                                aria-label={t('permissions.fields.approve_4')}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={(item.is_approve_5 ?? 0) === 1}
                                onChange={(e) => handleGranularPermissionToggle(type, index, 'is_approve_5', e.target.checked)}
                                disabled={isPending}
                                title={t('permissions.fields.approve_5')}
                                aria-label={t('permissions.fields.approve_5')}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }}
                  </Each>
                }>
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-10 text-slate-400 text-sm">
                      {t(emptyKey)}
                    </TableCell>
                  </TableRow>
                </Show>
              }>
                {renderSkeletonRows(12)}
              </Show>
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // ─── COA access table ───
  const renderCoaTable = (data: IUserCoaAccess[], isLoading: boolean) => {
    return (
      <div className="overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl" style={{ maxHeight: '55vh' }}>
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-36">{t('permissions.fields.coa_code')}</TableHead>
              <TableHead>{t('permissions.fields.description')}</TableHead>
              <TableHead className="w-24 text-center">{t('permissions.fields.has_access')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show when={isLoading} fallback={
              <Show when={data.length === 0} fallback={
                <Each of={data}>
                  {(item: IUserCoaAccess, index: number) => (
                    <TableRow key={item.perkiraan} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <TableCell className="font-mono text-sm text-slate-700 dark:text-slate-300">
                        {item.perkiraan}
                      </TableCell>
                      <TableCell className="text-sm">{item.keterangan}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            type="checkbox"
                            checked={item.checked === 1}
                            onChange={(e) => handleCoaToggle(index, e.target.checked)}
                            disabled={isPending}
                            aria-label={t('permissions.fields.has_access')}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Each>
              }>
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-slate-400 text-sm">
                    {t('permissions.no_coa')}
                  </TableCell>
                </TableRow>
              </Show>
            }>
              {renderSkeletonRows(3)}
            </Show>
          </TableBody>
        </Table>
      </div>
    )
  }

  const tabsConfig = [
    {
      label: t('permissions.tab_menu'),
      value: 'menu',
      content: <div className="pt-4">{renderPermissionTable('menu', menuList, isMenuLoading)}</div>,
    },
    {
      label: t('permissions.tab_report'),
      value: 'report',
      content: <div className="pt-4">{renderPermissionTable('report', reportList, isReportLoading)}</div>,
    },
    {
      label: t('permissions.tab_coa'),
      value: 'coa',
      content: <div className="pt-4">{renderCoaTable(coaList, isCoaLoading)}</div>,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-lg font-semibold">
            {t('permissions.title')}
            <Show when={!!userId}>
              <span className="ml-2 text-primary-600 dark:text-primary-400 font-mono">
                — {user?.full_name || userId}
              </span>
            </Show>
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('permissions.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 py-4">
          <Tabs
            tabs={tabsConfig}
            defaultValue="menu"
            onValueChange={(v) => setActiveTab(v as TPermissionTab)}
          />
        </div>

        <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('permissions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || isAnyLoading}
            loading={isPending}
          >
            {t('permissions.save_changes')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
