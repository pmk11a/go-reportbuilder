import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useUsers } from '@/domains/users/hooks/useUsers'
import { useToast } from '@/shared/hooks/use-toast'
import type { IUserPermission, IUserCoaAccess } from '@/domains/users/types/user'
import { applyCascadeForField, type TGranularField } from '../permissionCascade'
import { PermissionRow } from '../PermissionRow'
import {
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
  Spinner,
} from '@/shared/ui'
import { Each, Show } from '@/shared/ui/layout/Render'

interface IUserPermissionsTabProps {
  userId: string
  isStandalone?: boolean
  onSaveSuccess?: () => void
  onCancel?: () => void
}

type TPermissionTab = 'menu' | 'report' | 'coa'

export function UserPermissionsTab({
  userId,
  isStandalone = false,
  onSaveSuccess,
  onCancel,
}: IUserPermissionsTabProps) {
  const { t } = useTranslation(['users', 'common'])
  const { toast } = useToast()
  const {
    useUserMenuPermissions,
    useUserReportPermissions,
    useUserCoaAccess,
    useUpdateUserPermissions,
  } = useUsers()

  const [activeTab, setActiveTab] = useState<TPermissionTab>('menu')

  // Per-tab queries: ALL3 queries are always enabled
  const { data: menuData, isLoading: isMenuLoading } = useUserMenuPermissions(userId, { enabled: true })
  const { data: reportData, isLoading: isReportLoading } = useUserReportPermissions(userId, { enabled: true })
  const { data: coaData, isLoading: isCoaLoading } = useUserCoaAccess(userId, { enabled: true })

  const updateMutation = useUpdateUserPermissions()

  const [menuList, setMenuList] = useState<IUserPermission[]>([])
  const [reportList, setReportList] = useState<IUserPermission[]>([])
  const [coaList, setCoaList] = useState<IUserCoaAccess[]>([])

  const isPending = updateMutation.isPending
  const isAnyLoading = isMenuLoading || isReportLoading || isCoaLoading

  // Labels for permission fields
  const labels = {
    access: t('permissions.fields.access'),
    create: t('permissions.fields.create'),
    update: t('permissions.fields.update'),
    delete: t('permissions.fields.delete'),
    print: t('permissions.fields.print'),
    export: t('permissions.fields.export'),
    level_1: t('permissions.fields.level_1'),
    level_2: t('permissions.fields.level_2'),
    level_3: t('permissions.fields.level_3'),
    level_4: t('permissions.fields.level_4'),
    level_5: t('permissions.fields.level_5'),
  }

  // Hydrate local edit state when each tab's query resolves
  useEffect(() => {
    if (menuData) setMenuList(menuData)
  }, [menuData])

  useEffect(() => {
    if (reportData) setReportList(reportData)
  }, [reportData])

  useEffect(() => {
    if (coaData) setCoaList(coaData)
  }, [coaData])

  // Cascade toggle handlers
  const handleAccessToggle = useCallback(
    (type: 'menu' | 'report', index: number, value: boolean) => {
      const numericVal: 0 | 1 = value ? 1 : 0
      const setter = type === 'menu' ? setMenuList : setReportList
      const list = type === 'menu' ? menuList : reportList
      setter(applyCascadeForField(list, index, 'has_access', numericVal))
    },
    [menuList, reportList],
  )

  const handleGranularPermissionToggle = useCallback(
    (type: 'menu' | 'report', index: number, field: TGranularField, value: boolean) => {
      const numericVal: 0 | 1 = value ? 1 : 0
      const setter = type === 'menu' ? setMenuList : setReportList
      const list = type === 'menu' ? menuList : reportList
      const target = list[index]
      const isParentRow = !!target && target.l0 === 0 && target.l1 === 0
      if (isParentRow) {
        setter(applyCascadeForField(list, index, field, numericVal))
        return
      }
      const updated = [...list]
      updated[index] = { ...updated[index], [field]: numericVal }
      setter(updated)
    },
    [menuList, reportList],
  )

  const handleCoaToggle = (index: number, value: boolean) => {
    const updated = [...coaList]
    updated[index] = { ...updated[index], checked: value ? 1 : 0 }
    setCoaList(updated)
  }

  const handleSave = () => {
    updateMutation.mutate(
      {
        id: userId,
        data: { menu: menuList, report: reportList, coa: coaList },
      },
      {
        onSuccess: () => {
          toast({
            title: t('common.success', 'Success'),
            description: t('permissions.save_success', 'User permissions updated successfully'),
            variant: 'success',
          })
          if (onSaveSuccess) onSaveSuccess()
        },
        onError: (error: any) => {
          toast({
            title: t('common.error', 'Error'),
            description: error?.message || t('permissions.save_failed', 'Failed to update permissions'),
            variant: 'destructive',
          })
        },
      }
    )
  }

  // Skeleton loader for table rows
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

  // Permission table renderer
  const renderPermissionTable = (
    type: 'menu' | 'report',
    data: IUserPermission[],
    isLoading: boolean,
  ) => {
    const emptyKey = type === 'menu' ? 'permissions.no_menus' : 'permissions.no_reports'
    const isMenu = type === 'menu'
    const totalCols = isMenu ? 12 : 4

    return (
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]" rowSpan={isMenu ? 2 : 1}>
                  {isMenu ? t('permissions.fields.menu') : t('permissions.fields.report')}
                </TableHead>
                <TableHead className="w-16 text-center" rowSpan={isMenu ? 2 : 1}>
                  {t('permissions.fields.access')}
                </TableHead>
                <Show when={isMenu}>
                  <TableHead className="w-14 text-center" rowSpan={2}>{t('permissions.fields.create')}</TableHead>
                  <TableHead className="w-14 text-center" rowSpan={2}>{t('permissions.fields.update')}</TableHead>
                  <TableHead className="w-14 text-center" rowSpan={2}>{t('permissions.fields.delete')}</TableHead>
                  <TableHead className="w-14 text-center" rowSpan={2}>{t('permissions.fields.print')}</TableHead>
                  <TableHead className="w-14 text-center" rowSpan={2}>{t('permissions.fields.export')}</TableHead>
                  <TableHead className="text-center" colSpan={5}>{t('permissions.fields.approvals')}</TableHead>
                </Show>
                <Show when={!isMenu}>
                  <TableHead className="w-14 text-center" rowSpan={1}>{t('permissions.fields.print')}</TableHead>
                  <TableHead className="w-14 text-center" rowSpan={1}>{t('permissions.fields.export')}</TableHead>
                </Show>
              </TableRow>
              <Show when={isMenu}>
                <TableRow>
                  <TableHead className="w-14 text-center text-[10px]">{t('permissions.fields.level_1')}</TableHead>
                  <TableHead className="w-14 text-center text-[10px]">{t('permissions.fields.level_2')}</TableHead>
                  <TableHead className="w-14 text-center text-[10px]">{t('permissions.fields.level_3')}</TableHead>
                  <TableHead className="w-14 text-center text-[10px]">{t('permissions.fields.level_4')}</TableHead>
                  <TableHead className="w-14 text-center text-[10px]">{t('permissions.fields.level_5')}</TableHead>
                </TableRow>
              </Show>
            </TableHeader>
            <TableBody>
              <Show when={isLoading} fallback={
                <Show when={data.length === 0} fallback={
                  <Each of={data}>
                    {(item: IUserPermission, index: number) => (
                      <PermissionRow
                        key={item.kodemenu}
                        type={type}
                        item={item}
                        index={index}
                        showGranular={isMenu}
                        isPending={isPending}
                        labels={labels}
                        onAccessToggle={handleAccessToggle}
                        onGranularToggle={handleGranularPermissionToggle}
                      />
                    )}
                  </Each>
                }>
                  <TableRow>
                    <TableCell colSpan={totalCols} className="text-center py-10 text-slate-400 text-sm">
                      {t(emptyKey)}
                    </TableCell>
                  </TableRow>
                </Show>
              }>
                {renderSkeletonRows(totalCols)}
              </Show>
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // COA table renderer
  const renderCoaTable = (data: IUserCoaAccess[], isLoading: boolean) => {
    return (
      <div className="overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl" style={{ maxHeight: '55vh' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('permissions.fields.perkiraan_coa')}</TableHead>
              <TableHead className="w-32 text-center">{t('permissions.fields.access')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show when={isLoading} fallback={
              <Show when={data.length === 0} fallback={
                <Each of={data}>
                  {(item: IUserCoaAccess, index: number) => (
                    <TableRow key={item.perkiraan} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <TableCell>
                        <div className="font-mono text-sm text-slate-700 dark:text-slate-300">{item.perkiraan}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.keterangan}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            type="checkbox"
                            checked={item.checked === 1}
                            onChange={(e) => handleCoaToggle(index, e.target.checked)}
                            disabled={isPending}
                            aria-label={t('permissions.fields.access')}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Each>
              }>
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-10 text-slate-400 text-sm">
                    {t('permissions.no_coa')}
                  </TableCell>
                </TableRow>
              </Show>
            }>
              {renderSkeletonRows(2)}
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
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('permissions.title', 'User Permissions')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('permissions.description', 'Configure menu, report, and COA access controls for this user.')}
          </p>
        </div>

        <div className="p-6">
          <Tabs
            tabs={tabsConfig}
            defaultValue="menu"
            onValueChange={(v) => setActiveTab(v as TPermissionTab)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <Show when={isStandalone && onCancel}>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              {t('common.cancel', 'Cancel')}
            </Button>
          </Show>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || isAnyLoading}
            loading={isPending}
          >
            {t('permissions.save_changes', 'Save Changes')}
          </Button>
        </div>
      </div>
    </div>
  )
}