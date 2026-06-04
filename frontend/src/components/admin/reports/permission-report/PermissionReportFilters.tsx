import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  SearchableSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type SearchableSelectOption,
} from '@/components/ui'
import { userService } from '@/services/userService'
import { menuService } from '@/services/menuService'
import type {
  IPermissionReportFilters,
  TMenuTypeFilter,
} from '@/types/permissionReport'

const PICKER_PAGE_SIZE = 200

export interface PermissionReportFiltersProps {
  /**
   * The current "draft" filter state — controlled by the parent so it can
   * mirror it into the applied filters when the user clicks "Apply".
   */
  value: IPermissionReportFilters
  onChange: (next: IPermissionReportFilters) => void
  onApply: () => void
  onReset: () => void
  isApplying?: boolean
}

/**
 * Filter bar for the Permission Report page.
 *
 * Three controls: user picker, menu picker, menu-type toggle.
 * The picker dropdowns are populated lazily on the first render of the page
 * (via TanStack Query) so they cache between filter changes.
 */
export function PermissionReportFilters({
  value,
  onChange,
  onApply,
  onReset,
  isApplying,
}: PermissionReportFiltersProps) {
  const { t } = useTranslation(['reports', 'common'])

  // ─── Lazy-load all users for the picker (single-page, 200 items) ───
  const { data: usersData } = useQuery({
    queryKey: ['users', 'picker', PICKER_PAGE_SIZE],
    queryFn: () => userService.list({ page: 1, limit: PICKER_PAGE_SIZE, search: '', status: '' }),
    staleTime: 5 * 60 * 1000,
  })

  // ─── Lazy-load menus for the picker ───
  const { data: menusData } = useQuery({
    queryKey: ['menus', 'picker', PICKER_PAGE_SIZE],
    queryFn: () => menuService.getPaginatedMenus(1, PICKER_PAGE_SIZE, ''),
    staleTime: 5 * 60 * 1000,
  })

  const userOptions: SearchableSelectOption[] = useMemo(() => {
    const rows = (usersData?.data as Array<{ user_id?: string; uid?: string; full_name?: string }> | undefined) ?? []
    return rows.map((u) => ({
      value: u.user_id || u.uid || '',
      label: `${u.full_name || u.user_id || u.uid || ''} (${u.user_id || u.uid || ''})`,
    })).filter((o) => !!o.value)
  }, [usersData])

  const menuOptions: SearchableSelectOption[] = useMemo(() => {
    const rows = (menusData?.data as Array<{ kodemenu?: string; keterangan?: string }> | undefined) ?? []
    return rows.map((m) => ({
      value: m.kodemenu || '',
      label: `${m.keterangan || ''} (${m.kodemenu || ''})`,
    })).filter((o) => !!o.value)
  }, [menusData])

  // Local state mirrors props for an "uncommitted" picker experience.
  const [userId, setUserId] = useState<string>(value.user_id ?? '')
  const [menuId, setMenuId] = useState<string>(value.menu_id ?? '')
  const [menuType, setMenuType] = useState<TMenuTypeFilter>(value.menu_type ?? 'menu')

  const handleApply = () => {
    onChange({
      ...value,
      user_id: userId || undefined,
      menu_id: menuId || undefined,
      menu_type: menuType,
      page: 1,
    })
    onApply()
  }

  const handleReset = () => {
    setUserId('')
    setMenuId('')
    setMenuType('menu')
    onReset()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('permission_report.filters.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User picker */}
          <div className="space-y-2">
            <Label htmlFor="permission-report-user">
              {t('permission_report.filters.user')}
            </Label>
            <SearchableSelect
              id="permission-report-user"
              value={userId}
              onValueChange={setUserId}
              placeholder={t('permission_report.filters.user_placeholder')}
              options={userOptions}
            />
          </div>

          {/* Menu picker */}
          <div className="space-y-2">
            <Label htmlFor="permission-report-menu">
              {t('permission_report.filters.menu')}
            </Label>
            <SearchableSelect
              id="permission-report-menu"
              value={menuId}
              onValueChange={setMenuId}
              placeholder={t('permission_report.filters.menu_placeholder')}
              options={menuOptions}
            />
          </div>

          {/* Menu type */}
          <div className="space-y-2">
            <Label htmlFor="permission-report-type">
              {t('permission_report.filters.menu_type')}
            </Label>
            <Select
              value={menuType}
              onValueChange={(v) => setMenuType(v as TMenuTypeFilter)}
            >
              <SelectTrigger id="permission-report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="menu">{t('permission_report.filters.menu_type_menu')}</SelectItem>
                <SelectItem value="report">{t('permission_report.filters.menu_type_report')}</SelectItem>
                <SelectItem value="all">{t('permission_report.filters.menu_type_all')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end mt-4">
          <Button variant="outline" onClick={handleReset} disabled={isApplying}>
            {t('permission_report.filters.reset')}
          </Button>
          <Button onClick={handleApply} disabled={isApplying} loading={isApplying}>
            {t('permission_report.filters.apply')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
