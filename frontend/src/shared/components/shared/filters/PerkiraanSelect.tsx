/**
 * Re-export shim.
 *
 * The PerkiraanSelect lives in `@/domains/browse/components/browse/PerkiraanSelect`,
 * implemented with the generic Go-backed browse facility.
 *
 * This file is kept to preserve the old import path
 * (`@/shared/components/shared/filters/PerkiraanSelect`) so existing callers
 * continue to work without modification.
 */
export { PerkiraanSelect } from '@/domains/browse/components/browse/PerkiraanSelect'
