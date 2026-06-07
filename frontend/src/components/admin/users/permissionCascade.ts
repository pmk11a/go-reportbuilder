// Shared cascade logic for the user permissions dialog (Menu and Report
// tabs). Extracted from UserPermissionsDialog so the helper can be unit-
// tested in isolation and reused from the memoized row component.

import type { IUserPermission } from '@/types/user'

// All permission columns that can be cascaded from a parent row. Kept as a
// single source of truth so the cascade helper and the column renderer stay
// in sync. `TGranularField` is derived from this union (granular = everything
// except ACCESS, which is the parent→child cascade entry point).
export type TCascadableField =
  | 'has_access'
  | 'is_create'
  | 'is_update'
  | 'is_delete'
  | 'is_print'
  | 'is_export'
  | 'is_approve_1'
  | 'is_approve_2'
  | 'is_approve_3'
  | 'is_approve_4'
  | 'is_approve_5'

export type TGranularField = Exclude<TCascadableField, 'has_access'>

/**
 * isDescendantOf returns true when `child.kodemenu` is a strict hierarchical
 * descendant of `parent.kodemenu` based on a prefix-extension rule.
 *
 * The legacy userlog data model uses `kodemenu` as a path-like code (e.g.
 * "MENU-001" → "MENU-001-01"). A "child" is any row whose kodemenu starts
 * with the parent's kodemenu AND has additional characters (a strict prefix
 * extension). The same row is never considered its own descendant.
 */
export function isDescendantOf(child: IUserPermission, parent: IUserPermission): boolean {
  if (child.kodemenu === parent.kodemenu) return false
  return child.kodemenu.startsWith(parent.kodemenu)
}

/**
 * applyCascadeForField sets `field` on the given row and all of its descendants
 * (in the same tab) to the same value. Returns a new list — never mutates the
 * input. The cascade is field-scoped: only the named column flips, every other
 * column on the descendant rows is left untouched.
 *
 * Why pure / in-place-list reasoning: the cascade must be visible to the user
 * immediately, and the parent / children live in the same rendered list. A
 * single state update is simpler and matches the legacy userlog behaviour
 * where checking a parent checked every child.
 */
export function applyCascadeForField(
  rows: IUserPermission[],
  parentIndex: number,
  field: TCascadableField,
  newValue: 0 | 1,
): IUserPermission[] {
  const parent = rows[parentIndex]
  if (!parent) return rows
  return rows.map((row) => {
    if (row.kodemenu === parent.kodemenu || isDescendantOf(row, parent)) {
      return { ...row, [field]: newValue }
    }
    return row
  })
}
