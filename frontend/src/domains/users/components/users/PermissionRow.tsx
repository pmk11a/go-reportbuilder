
import { TableRow, TableCell, Checkbox } from '@/shared/ui'
import { cn } from '@/shared/utils/cn'
import type { IUserPermission } from '@/domains/users/types/user'
import type { TGranularField } from './permissionCascade'

/**
 * IPermissionRowProps carries everything a single row needs to render and
 * to dispatch its own toggle events. The row is intentionally a dumb
 * component — parent owns the data, we just emit (index, value) up.
 *
 * Keeping the prop surface flat lets `React.memo` shallow-compare the
 * row's displayable fields. When a parent cascades ACCESS / CREATE /
 * etc., only the rows whose data actually changed will re-render.
 */
interface IPermissionRowProps {
  type: 'menu' | 'report'
  item: IUserPermission
  index: number
  showGranular: boolean
  isPending: boolean
  labels: {
    access: string
    create: string
    update: string
    delete: string
    print: string
    export: string
    level_1: string
    level_2: string
    level_3: string
    level_4: string
    level_5: string
  }
  onAccessToggle: (type: 'menu' | 'report', index: number, value: boolean) => void
  onGranularToggle: (type: 'menu' | 'report', index: number, field: TGranularField, value: boolean) => void
}

/**
 * PermissionRowImpl renders one menu / report permission row. Visual
 * hierarchy is conveyed in two ways:
 *   1. L0=0 / L1=0 root-level parent rows get a red left-border on the
 *      MENU cell to mark them as group roots (replaces the previous
 *      "Group: L0 N" header row).
 *   2. Deeper rows get progressively wider left padding (pl-8 / pl-14 /
 *      pl-20) to push child menu text further to the right.
 *
 * NOTE: This component does NOT call useTranslation — the parent builds
 * the labels object once and passes it as a prop. This avoids 100+
 * i18n context subscriptions when rendering large permission tables.
 */
function PermissionRowImpl({
  type,
  item,
  index,
  showGranular,
  isPending,
  labels,
  onAccessToggle,
  onGranularToggle,
}: IPermissionRowProps) {
  const isRoot = item.l0 === 0 && item.l1 === 0
  const indentClass =
    item.l3 > 0 ? 'pl-20' :
    item.l2 > 0 ? 'pl-14' :
    item.l1 > 0 ? 'pl-8' :
    'pl-2 font-semibold text-slate-800 dark:text-slate-100'
  const menuCellClass = cn(
    indentClass,
    isRoot && 'border-l-4 border-red-500',
  )

  return (
    <TableRow className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
      <TableCell className={menuCellClass}>
        <div>
          <span>{item.keterangan}</span>
          <span className="text-xs text-slate-400 ml-2 font-mono">({item.kodemenu})</span>
        </div>
      </TableCell>
      {/* ACCESS — writes to has_access; cascades to descendants. */}
      <TableCell className="text-center">
        <div className="flex justify-center">
          <Checkbox
            checked={(item.has_access ?? 0) === 1}
            onChange={(e) => onAccessToggle(type, index, e.target.checked)}
            disabled={isPending}
            title={labels.access}
            aria-label={labels.access}
          />
        </div>
      </TableCell>
      {showGranular && (
        <>
          {/* CREATE */}
          <TableCell className="text-center">
            <div className="flex justify-center">
              <Checkbox
                checked={(item.is_create ?? 0) === 1}
                onChange={(e) => onGranularToggle(type, index, 'is_create', e.target.checked)}
                disabled={isPending}
                title={labels.create}
                aria-label={labels.create}
              />
            </div>
          </TableCell>
          {/* UPDATE */}
          <TableCell className="text-center">
            <div className="flex justify-center">
              <Checkbox
                checked={(item.is_update ?? 0) === 1}
                onChange={(e) => onGranularToggle(type, index, 'is_update', e.target.checked)}
                disabled={isPending}
                title={labels.update}
                aria-label={labels.update}
              />
            </div>
          </TableCell>
          {/* DELETE */}
          <TableCell className="text-center">
            <div className="flex justify-center">
              <Checkbox
                checked={(item.is_delete ?? 0) === 1}
                onChange={(e) => onGranularToggle(type, index, 'is_delete', e.target.checked)}
                disabled={isPending}
                title={labels.delete}
                aria-label={labels.delete}
              />
            </div>
          </TableCell>
          {/* PRINT */}
          <TableCell className="text-center">
            <div className="flex justify-center">
              <Checkbox
                checked={(item.is_print ?? 0) === 1}
                onChange={(e) => onGranularToggle(type, index, 'is_print', e.target.checked)}
                disabled={isPending}
                title={labels.print}
                aria-label={labels.print}
              />
            </div>
          </TableCell>
          {/* EXPORT */}
          <TableCell className="text-center">
            <div className="flex justify-center">
              <Checkbox
                checked={(item.is_export ?? 0) === 1}
                onChange={(e) => onGranularToggle(type, index, 'is_export', e.target.checked)}
                disabled={isPending}
                title={labels.export}
                aria-label={labels.export}
              />
            </div>
          </TableCell>
          {/* APPROVE 1..5 */}
          <TableCell className="text-center">
            <div className="flex justify-center">
              <Checkbox
                checked={(item.is_approve_1 ?? 0) === 1}
                onChange={(e) => onGranularToggle(type, index, 'is_approve_1', e.target.checked)}
                disabled={isPending}
                title={labels.level_1}
                aria-label={labels.level_1}
              />
            </div>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex justify-center">
              <Checkbox
                checked={(item.is_approve_2 ?? 0) === 1}
                onChange={(e) => onGranularToggle(type, index, 'is_approve_2', e.target.checked)}
                disabled={isPending}
                title={labels.level_2}
                aria-label={labels.level_2}
              />
            </div>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex justify-center">
              <Checkbox
                checked={(item.is_approve_3 ?? 0) === 1}
                onChange={(e) => onGranularToggle(type, index, 'is_approve_3', e.target.checked)}
                disabled={isPending}
                title={labels.level_3}
                aria-label={labels.level_3}
              />
            </div>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex justify-center">
              <Checkbox
                checked={(item.is_approve_4 ?? 0) === 1}
                onChange={(e) => onGranularToggle(type, index, 'is_approve_4', e.target.checked)}
                disabled={isPending}
                title={labels.level_4}
                aria-label={labels.level_4}
              />
            </div>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex justify-center">
              <Checkbox
                checked={(item.is_approve_5 ?? 0) === 1}
                onChange={(e) => onGranularToggle(type, index, 'is_approve_5', e.target.checked)}
                disabled={isPending}
                title={labels.level_5}
                aria-label={labels.level_5}
              />
            </div>
          </TableCell>
        </>
      )}
    </TableRow>
  )
}

/**
 * permissionRowPropsAreEqual decides whether a row needs to re-render.
 *
 * When a parent cascade runs, `applyCascadeForField` returns a brand-new
 * array of all rows — that means EVERY row's `item` prop is a fresh
 * object reference, even rows whose displayable values are unchanged.
 * With React.memo's default shallow comparison, every row would re-render
 * (defeating the purpose of the memo). So this comparator does two things:
 *
 *   1. When the item reference changed, it dives into the displayable
 *      fields and returns `true` (skip render) if none of them differ.
 *   2. When the item reference is the same, it still verifies the other
 *      props (type, index, showGranular, isPending, handler refs) haven't
 *      changed — the handlers are stabilised with useCallback in the
 *      parent so this is the fast path for unrelated re-renders.
 */
function permissionRowPropsAreEqual(
  prev: Readonly<IPermissionRowProps>,
  next: Readonly<IPermissionRowProps>,
): boolean {
  if (prev.item !== next.item) {
    // Item identity changed (cascade created a new object), but only re-render
    // if a displayable field actually changed.
    const a = prev.item
    const b = next.item
    if (
      a.has_access !== b.has_access ||
      a.is_create !== b.is_create ||
      a.is_update !== b.is_update ||
      a.is_delete !== b.is_delete ||
      a.is_print !== b.is_print ||
      a.is_export !== b.is_export ||
      a.is_approve_1 !== b.is_approve_1 ||
      a.is_approve_2 !== b.is_approve_2 ||
      a.is_approve_3 !== b.is_approve_3 ||
      a.is_approve_4 !== b.is_approve_4 ||
      a.is_approve_5 !== b.is_approve_5
    ) {
      return false
    }
  }
  return (
    prev.type === next.type &&
    prev.index === next.index &&
    prev.showGranular === next.showGranular &&
    prev.isPending === next.isPending &&
    prev.labels === next.labels &&
    prev.onAccessToggle === next.onAccessToggle &&
    prev.onGranularToggle === next.onGranularToggle
  )
}

/**
 * PermissionRow is the memoised row component used by UserPermissionsTab
 * for both Menu and Report groups. The custom comparator (see
 * permissionRowPropsAreEqual) lets sibling rows that weren't part of a
 * cascade skip the re-render entirely, which removes the 1s+ lag reported
 * when toggling a parent ACCESS / granular checkbox.
 */
export const PermissionRow = React.memo(PermissionRowImpl, permissionRowPropsAreEqual)