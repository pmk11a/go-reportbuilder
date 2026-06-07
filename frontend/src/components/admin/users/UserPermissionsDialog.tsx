import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useUsers } from '@/hooks/useUsers'
import type { IUserPermission, IUserCoaAccess } from '@/types/user'
import {
  applyCascadeForField,
  type TGranularField,
} from './permissionCascade'
import { PermissionRow } from './PermissionRow'
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

  // ─── Per-tab queries: ALL3 queries are enabled when dialog is open.
  // The 10-min staleTime keeps the cache hot — switching tabs uses cached
  // data with no network round-trip. This fixes the "empty data on tab switch"
  // bug where only the active tab's query was enabled.
  const {
    data: menuData,
    isLoading: isMenuLoading,
  } = useUserMenuPermissions(userId, { enabled: open })

  const {
    data: reportData,
    isLoading: isReportLoading,
  } = useUserReportPermissions(userId, { enabled: open })

  const {
    data: coaData,
    isLoading: isCoaLoading,
  } = useUserCoaAccess(userId, { enabled: open })

  const updateMutation = useUpdateUserPermissions()

  const [menuList, setMenuList] = useState<IUserPermission[]>([])
  const [reportList, setReportList] = useState<IUserPermission[]>([])
  const [coaList, setCoaList] = useState<IUserCoaAccess[]>([])

  // isPending tracks ONLY the mutation — the save to server.
  // We disable the save button and all checkboxes only during the network
  // request, NOT during local state transitions (cascade toggles). The
  // useTransition below marks cascade updates as non-urgent so React can
  // interleave rendering without blocking the UI.
  const isPending = updateMutation.isPending
  const isAnyLoading = isMenuLoading || isReportLoading || isCoaLoading

  // ─── Labels object: built once per dialog render, passed to every PermissionRow.
  // This replaces the per-row useTranslation call that caused 100+ context
  // subscriptions overhead.
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

  // Hydrate local edit state when each tab's query resolves OR when the
  // dialog reopens (handles the case where the query returns cached data
  // with the same reference — we still want to hydrate from cache).
  useEffect(() => {
    if (open && menuData) setMenuList(menuData)
  }, [open, menuData])

  useEffect(() => {
    if (open && reportData) setReportList(reportData)
  }, [open, reportData])

  useEffect(() => {
    if (open && coaData) setCoaList(coaData)
  }, [open, coaData])

  // Reset all local edit state when dialog closes.
  useEffect(() => {
    if (!open) {
      setMenuList([])
      setReportList([])
      setCoaList([])
      setActiveTab('menu')
    }
  }, [open])

  /**
   * handleAccessToggle writes `has_access` on the toggled row AND on every
   * descendant row in the same tab. Routed through `applyCascadeForField` so
   * the cascade logic stays in one place. The update is synchronous — the
   * cascade helper runs in <1ms even for 200+ rows, so no useTransition needed.
   */
  const handleAccessToggle = useCallback(
    (type: 'menu' | 'report', index: number, value: boolean) => {
      const numericVal: 0 | 1 = value ? 1 : 0
      const setter = type === 'menu' ? setMenuList : setReportList
      const list = type === 'menu' ? menuList : reportList
      setter(applyCascadeForField(list, index, 'has_access', numericVal))
    },
    [menuList, reportList],
  )

  /**
   * handleGranularPermissionToggle writes the named column on the toggled row.
   * If that row is a parent (L0=0 AND L1=0), the change cascades down to every
   * descendant for that single column only — the sibling columns on the
   * descendants are left untouched. Non-parent rows never cascade.
   */
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

  /**
   * Renders the Menu / Report permission table. The Menu tab uses 8 columns
   * (1 name + 1 ACCESS + 5 granular + 5 approval) with an APPROVALS sub-
   * header; the Report tab uses 4 columns (1 name + 1 ACCESS + 2 granular).
   *
   * Rows render in the natural order they arrive in `data` — no grouping
   * wrapper. Parent rows (L0=0 / L1=0) are visually distinguished by a red
   * left border on the MENU cell (see `PermissionRow`).
   *
   * Handlers are passed directly (not via buildRowHandlers) so that
   * PermissionRow's React.memo comparator sees stable references across
   * renders. The `type` prop tells each row which tab it's in.
   */
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
                  <TableHead className="w-14 text-center" rowSpan={2}>
                    {t('permissions.fields.create')}
                  </TableHead>
                  <TableHead className="w-14 text-center" rowSpan={2}>
                    {t('permissions.fields.update')}
                  </TableHead>
                  <TableHead className="w-14 text-center" rowSpan={2}>
                    {t('permissions.fields.delete')}
                  </TableHead>
                  <TableHead className="w-14 text-center" rowSpan={2}>
                    {t('permissions.fields.print')}
                  </TableHead>
                  <TableHead className="w-14 text-center" rowSpan={2}>
                    {t('permissions.fields.export')}
                  </TableHead>
                  <TableHead className="text-center" colSpan={5}>
                    {t('permissions.fields.approvals')}
                  </TableHead>
                </Show>
                <Show when={!isMenu}>
                  <TableHead className="w-14 text-center" rowSpan={1}>
                    {t('permissions.fields.print')}
                  </TableHead>
                  <TableHead className="w-14 text-center" rowSpan={1}>
                    {t('permissions.fields.export')}
                  </TableHead>
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

  // ─── COA access table — 2 columns: PERKIRAAN/COA (code + description) and ACCESS ───
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
                        <div className="font-mono text-sm text-slate-700 dark:text-slate-300">
                          {item.perkiraan}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.keterangan}
                        </div>
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