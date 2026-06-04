# AI.md - Frontend Quick Reference

> **Global Rules**: Always refer to `../.gemini/ARCHITECTURE.md` for major architectural patterns. Code style (declarative names + English comments) is in `~/.claude/projects/.../memory/dapen-code-style.md`.
>
> **All language in code, comments, and documentation MUST be English.**

## 🎯 Frontend Focus (React, Vite, Tailwind v4)

The `frontend/` workspace completely separates UI, Data, and Logic.
The primary work in this area is always assigned to: **`@dapen-frontend`**

### 📋 Mandatory Frontend Checklist
- [ ] Components use libraries from `src/components/ui` if they already exist.
- [ ] NO Glassmorphism. Use standard Shadcn UI styling conventions.
- [ ] ALL forms MUST use a form controller (`react-hook-form` + `zod` via `<Form>`).
- [ ] No static data types inside components. Use types from `src/types/`.
- [ ] No network calls (`axios`/`fetch`) in components. Use `src/services/`.
- [ ] Errors are not formatted in components; they must pass through `src/utils/errorMapper.ts`.
- [ ] All text is wrapped using language translation (`useTranslation`). English is the default.
- [ ] **NO EXTRA HEADERS** - No page-specific titles or headers are allowed in route pages. The page header is exclusively managed and rendered by [MainHeader.tsx](file:///Users/codemasx/Storage/my-htdocs/dapen/golang-next/frontend/src/components/layouts/MainHeader.tsx) and must support i18n translations (multi-language).
- [ ] **SKELETONS MANDATORY** - Transitioning page loads, card loads, component loads, and data lists MUST use structured skeleton loaders (e.g. `<Skeleton>`) instead of simple loading spinners.
- [ ] **TOP PROGRESS BAR** - All API fetching operations MUST trigger the NProgress top progress bar indicator.
- [ ] **INLINE SPINNER ON SUBMIT** - Standard save/submit buttons must use standard inline spinners (`loading={...}` attribute on standard Button component).

## 📂 Main Frontend Structure

```
frontend/
├── src/
│   ├── api-handlers/    # Backend-for-Frontend (BFF) Routes
│   │   └── admin/       # admin-scoped BFF (users, menu, perkiraan, reports, ...)
│   ├── bff/             # BFF infrastructure (dispatcher, session, redis, rate-limit, csrf)
│   ├── components/      # UI Atoms, Layouts, and Dashboard Widgets
│   │   ├── ui/          # Atomic design primitives (Shadcn-style, NO Glassmorphism)
│   │   └── admin/       # Admin-specific components, grouped by feature
│   │       ├── menu/
│   │       ├── users/
│   │       ├── perkiraan/   # TASK-010
│   │       └── reports/     # TASK-009
│   ├── hooks/           # TanStack Query Integration
│   ├── locales/         # Translation data (EN & ID)
│   ├── routes/          # File-based routing (TanStack Router)
│   ├── services/        # HTTP connection logic to BFF/Backend
│   ├── store/           # Global State (Zustand)
│   ├── types/           # CENTRALIZED Interfaces & Types
│   └── utils/           # Pure helper functions
```

## ⚡ Quick Commands

Run frontend server:
```bash
npm run dev
```

If creating a new route in `src/routes`, sync the router:
```bash
npx @tanstack/router-cli generate
```

If modifying significant code, verify TypeScript Types:
```bash
npm run type-check
```

Run End-to-End Tests:
```bash
npx playwright test
```

## 🔐 User Permission Management - Granular Access Control

### Feature Location

- Types: `src/types/user.ts` (`IUserPermission`, `IUserCoaAccess`, `IUserPermissionsData`).
- BFF proxy: `src/api-handlers/admin/users/permissions/{menu,report,coa}.ts`.
- Service: `src/services/userService.ts` (`getUserMenuPermissions`, `getUserReportPermissions`, `getUserCoaAccess`, `getPermissions`, `updatePermissions`).
- Hooks: `src/hooks/useUsers.ts` — `useUserMenuPermissions`, `useUserReportPermissions`, `useUserCoaAccess` (each with `staleTime: 10 * 60 * 1000`), `useUpdateUserPermissions` (invalidates all 3 keys on success).
- UI: `src/components/admin/users/UserPermissionsDialog.tsx` — 3 tabs (Menu / Report / COA) with per-tab `<Skeleton>` loading, Read-column bug fixed.
- Page: `src/routes/admin/_layout/users/index.tsx` (host).

### Permission Fields

Each menu/report permission record supports:
- **Legacy Model** (backward compatible): `checked` (visible), `aktif` (active), `access` (level 0-3)
- **Granular Permissions**: `has_access` (Read), `is_create` (Create), `is_update` (Update), `is_delete` (Delete), `is_print` (Print), `is_export` (Export), `is_approve_1` to `is_approve_5` (Multi-level approval), `is_canceled` (Batal)

### i18n Keys

```json
// permissions.fields.*
"read", "create", "update", "delete", "print", "export",
"approve_1", "approve_2", "approve_3", "approve_4", "approve_5"
```

### Implementation Notes

- Each permission is a numeric field (0 = no, 1 = yes)
- UI uses emoji icons in table headers: 📖 ✏️ 🗑️ 🖨️ 📤 ✓1-5
- Granular fields are optional in API responses (defaults to 0 if missing)
- Legacy `access` field maintained for backward compatibility
- Horizontal scroll table handles 12+ columns for readability
- **Per-tab cache**: switching between Menu / Report / COA tabs inside the 10-min staleness window does NOT trigger a network refetch. The mutation invalidates all 3 cache keys on success.

## 📊 Permission Report (TASK-009)

A standalone `/admin/reports/permission-report` page exposes a matrix of
users × menus × permissions with print, Excel and PDF export.

### Pages & Components
- Page: `src/routes/admin/_layout/reports/permission-report/index.tsx`
- Components: `src/components/admin/reports/permission-report/`
  - `PermissionReportFilters.tsx` — user / menu / menu-type pickers
  - `PermissionReportTable.tsx` — matrix table with ✓ / ✗ cells
  - `PermissionReportActions.tsx` — Print / Excel / PDF
- Print stylesheet: `src/styles/print.css` (loaded via the page)

### Hooks & Services
- `src/hooks/usePermissionReport.ts` — TanStack Query hooks for matrix
  fetch + Excel/PDF download mutations.
- `src/services/permissionReportService.ts` — `getMatrix`, `downloadExcel`,
  `downloadPDF` (xlsx/pdf return `Blob`).

### BFF
- `src/api-handlers/admin/reports/permission-report.ts` — proxies the
  backend endpoint, relays binary streams unchanged.
- The dispatcher (`src/bff/dispatcher.ts`) now branches on `Content-Type`:
  binary responses are sent as `Buffer` instead of being UTF-8-decoded.

## 🔄 Per-Tab Permission Caching (TASK-009)

`useUserPermissions` (combined) has been removed in favour of 3 hooks:
- `useUserMenuPermissions(id, { enabled })`
- `useUserReportPermissions(id, { enabled })`
- `useUserCoaAccess(id, { enabled })`

Each uses `staleTime = 10 * 60 * 1000` and `gcTime = 15 * 60 * 1000`.
`useUpdateUserPermissions` invalidates all three per-tab cache keys on
success. `UserPermissionsDialog.tsx` consumes the per-tab hooks lazily,
gated by `activeTab`, so switching between tabs inside the 10-min staleness
window incurs zero network calls.

A long-standing bug at the Read column of `UserPermissionsDialog.tsx`
(line 199 was writing to `is_create` instead of `checked`) is fixed.

