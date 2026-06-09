# CLAUDE.md — Frontend (React, Vite, TanStack, Tailwind v4)

> See root `CLAUDE.md` for global rules. This file contains frontend-specific details.
>
> Primary agent for this workspace: **`@dapen-frontend`**

---

## TanStack Start Migration (TASK-016)

**Phase 1 COMPLETE** — Build infrastructure migrated from Vite SPA to TanStack Start SSR.

Changes:
- `vite.config.ts` uses `tanstackStart()` from `@tanstack/react-start/plugin/vite`
- `src/router.tsx` — router factory (replaces inline creation in old main.tsx)
- `src/start.ts` — TanStack Start instance (`createStart()`)
- `__root.tsx` wraps full `<html>` document with `<HeadContent />` + `<Scripts />`
- `index.html` and `src/main.tsx` deleted (plugin provides default entries)
- `react-helmet-async` removed — routes use `head()` option instead
- `QueryClientProvider` moved into `__root.tsx`

**Remaining (Phase 2-6):**
- Phase 2: Middleware (session/csrf/auth → `createMiddleware()`)
- Phase 3-4: Server functions replace `src/api-handlers/`
- Phase 5: Route loaders for SSR data prefetching
- Phase 6: Cleanup old BFF, E2E tests

**Until Phase 3+ complete, the BFF pattern below still exists in codebase (unused at runtime).**

---

## Architecture: Strict Separation of Concerns

```
Types → Services → Hooks → Components → Routes
```

All network I/O lives in `src/services/`, consumed via custom hooks in `src/hooks/`. UI components are pure presentational.

---

## Folder Layout

```
frontend/src/
├── api-handlers/    # BFF routes (server-side, Vite plugin dispatch)
│   └── admin/       # admin-scoped BFF (users, menu, perkiraan, reports...)
├── bff/             # BFF infra (dispatcher, session, redis, rate-limit, csrf)
├── components/      # UI components
│   ├── ui/          # Atomic design primitives (Shadcn-style, NO Glassmorphism)
│   └── admin/       # Admin-specific components grouped by feature
│       ├── menu/
│       ├── users/
│       ├── perkiraan/
│       └── reports/
├── hooks/           # TanStack Query integration hooks
├── locales/         # i18n translations (en + id)
├── routes/          # TanStack Router (file-based)
├── services/        # HTTP connection logic to BFF/backend
├── store/           # Zustand global state
├── types/           # CENTRALIZED TypeScript types
└── utils/           # Pure helpers (errorMapper, etc.)
```

---

## Mandatory Checklist

- [ ] Use components from `src/components/ui` when they already exist.
- [ ] **NO Glassmorphism.** Use Shadcn-style solid surfaces only (`globals.css`).
- [ ] All forms use `react-hook-form` + `zod` via `<Form>`.
- [ ] All types and interfaces in `src/types/`. No local type declarations inside components.
- [ ] No `axios`/`fetch` calls inside components. Use `src/services/` via hooks.
- [ ] All errors go through `src/utils/errorMapper.ts`. Components MUST NOT format errors.
- [ ] All user-facing strings use `useTranslation()`. Update `locales/en` AND `locales/id` together.
- [ ] **NO page-specific headers.** `MainHeader.tsx` owns the page title. No `<h1>` in route pages.
- [ ] **Skeleton mandatory.** All loading states use `<Skeleton />` — no plain spinners for layout loading.
- [ ] **NProgress top bar** triggered for all API fetching operations.
- [ ] Submit buttons use inline spinner via `loading={...}` prop on `<Button>`.
- [ ] Use `<Each />` and `<Show />` from `Render.tsx` for lists and conditionals. No raw `.map()`, `&&`, or ternary in TSX return.

---

## Naming Conventions

```typescript
// Types: I prefix for interfaces, T for types, P for component props
interface IUser { ... }
type TTheme = 'light' | 'dark'
interface PMenuFormDialog { isOpen: boolean; onClose: () => void }

// Variables: intention-revealing
const menuPermissionsForUser = data?.menu ?? []    // ✅
const perms = data?.menu ?? []                      // ❌

// Functions: action + target
function fetchMenuPermissionsForUser(userId: string) {}   // ✅
function getData() {}                                      // ❌

// `any` is FORBIDDEN — use unknown and narrow
```

---

## BFF Pattern

- `src/api-handlers/` contains server-side Vite plugin routes
- JWT stored in HttpOnly cookies — never exposed to browser JS
- All BFF handlers use `BffResponseBuilder`
- CSRF protection + Redis rate limiting in `src/bff/`
- `src/bff/dispatcher.ts` branches on `Content-Type` for binary streams (xlsx/pdf → `Buffer`)

---

## Error Handling

All API errors funnel through `src/utils/errorMapper.ts` (3-part format: What / Why / Next Steps). Components receive formatted error objects — never raw API errors.

---

## i18n

```typescript
// Always use useTranslation()
const { t } = useTranslation()
return <p>{t('permissions.fields.read')}</p>

// Update BOTH locale files together
// locales/en/permissions.json
// locales/id/permissions.json
```

---

## Data Rendering

```tsx
// ✅ Correct
<Each of={menuPermissionsForUser} render={(item) => <PermissionRow item={item} />} />
<Show when={isLoading} fallback={<PermissionTable />}><Skeleton /></Show>

// ❌ Forbidden
{menuPermissionsForUser.map(item => <PermissionRow key={item.id} item={item} />)}
{isLoading && <Skeleton />}
{isLoading ? <Skeleton /> : <PermissionTable />}
```

---

## Role-Based Routing

- Path prefixes: `/admin` and `/karyawan`
- TanStack Router's `beforeLoad` enforces access guards

---

## Loading States

- **Layout loading:** `<Skeleton />` — never plain "Loading…" text
- **Button submit:** `<Button loading={isPending}>Save</Button>`
- **API fetch:** NProgress top progress bar

---

## Testing

- **Unit:** Vitest + Testing Library (jsdom). Co-locate: `[filename].test.ts` or `.test.tsx`.
- **E2E:** Playwright in `frontend/e2e/[feature].spec.ts`.
- **Selectors:** Use `aria-label` or role — never hardcoded text (i18n-safe).
- **Wait for skeletons** to disappear before interacting in E2E tests.

---

## Quick Commands

```bash
npm run dev                              # Start dev server
npm run type-check                       # TypeScript check
npm test -- --run                        # Vitest unit tests (no watch)
npx playwright test                      # E2E tests
npx @tanstack/router-cli generate        # Sync routeTree.gen.ts after new routes
./scripts/check-all.sh --frontend-only   # Quality gate
```

---

## Permission Management Reference

### Types
`src/types/user.ts` — `IUserPermission`, `IUserCoaAccess`, `IUserPermissionsData`

### BFF Endpoints
`src/api-handlers/admin/users/permissions/{menu,report,coa}.ts`

### Service
`src/services/userService.ts` — `getUserMenuPermissions`, `getUserReportPermissions`, `getUserCoaAccess`, `updatePermissions`

### Hooks
`src/hooks/useUsers.ts`:
- `useUserMenuPermissions(id, opts)` — staleTime 10min
- `useUserReportPermissions(id, opts)` — staleTime 10min
- `useUserCoaAccess(id, opts)` — staleTime 10min
- `useUpdateUserPermissions` — invalidates all 3 cache keys on success

### UI
`src/components/admin/users/UserPermissionsDialog.tsx` — 3 tabs (Menu / Report / COA) with per-tab `<Skeleton>` loading.

---

## Permission Report (TASK-009)

- Page: `src/routes/admin/_layout/reports/permission-report/index.tsx`
- Components: `src/components/admin/reports/permission-report/`
- Hooks: `src/hooks/usePermissionReport.ts`
- Service: `src/services/permissionReportService.ts` (getMatrix, downloadExcel, downloadPDF)
- BFF: `src/api-handlers/admin/reports/permission-report.ts`

---

## Scope Discipline

**NEVER** modify files in `backend/`. That directory is owned by `@dapen-backend`.
