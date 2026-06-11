# CLAUDE.md — Frontend (React, Vite, TanStack, Tailwind v4)

> See root `CLAUDE.md` for global rules. This file contains frontend-specific details.
>
> Primary agent for this workspace: **`@dapen-frontend`**

---

## TanStack Start Migration (TASK-016)

**Phase 1-4 COMPLETE** — Build infrastructure, middleware, and server functions migrated.

### What Changed
- `vite.config.ts` uses `tanstackStart()` from `@tanstack/react-start/plugin/vite`
- `src/router.tsx` — router factory (replaces inline creation in old main.tsx)
- `src/start.ts` — TanStack Start instance (`createStart()`)
- `__root.tsx` wraps full `<html>` document with `<HeadContent />` + `<Scripts />`
- `index.html` and `src/main.tsx` deleted (plugin provides default entries)
- `react-helmet-async` removed — routes use `head()` option instead
- `QueryClientProvider` moved into `__root.tsx`
- Server functions replace BFF API routes (see Server Functions section below)

**Remaining (Phase 5-6):**
- Phase 5: Route loaders for SSR data prefetching (optional/deferred)
- Phase 6: Cleanup old `src/bff/` and `src/api-handlers/`, E2E tests

**Old BFF files (`src/api-handlers/`, `src/bff/`) still exist but are unused at runtime.**

---

## Server Functions (CRITICAL — New Architecture)

Server functions replace the old BFF API routes. They run server-side and are called via RPC from the browser.

### File Structure
```
src/server/
├── utils.ts              # getEnv(), parseEnvTime() — shared server utilities
├── backend.ts            # makeBackendRequest() — fetch wrapper with timeout/logging
├── session.ts            # Redis session CRUD, token refresh with RTR lock
├── redis.ts              # Redis client singleton (ioredis)
├── functions/
│   ├── auth/
│   │   ├── index.ts      # barrel export
│   │   ├── login.ts      # loginFn — createServerFn
│   │   ├── logout.ts     # logoutFn
│   │   └── me.ts         # meFn — session check
│   ├── accounting/       # domain-specific server functions
│   ├── admin/            # admin server functions
│   └── shared/           # cross-domain server functions
└── middleware/
    ├── session.ts        # sessionMiddleware — getCookie + Redis lookup
    ├── csrf.ts           # CSRF middleware
    └── auth.ts           # auth guard middleware
```

### Key APIs
| API | Package | Usage |
|-----|---------|-------|
| `createServerFn` | `@tanstack/react-start` | Create server function with `.validator()` + `.handler()` |
| `createMiddleware` | `@tanstack/react-start` | Create reusable middleware chain |
| `setCookie` / `getCookie` / `deleteCookie` | `@tanstack/start-server-core` | HttpOnly cookie management (wraps H3 via AsyncLocalStorage) |
| `createCsrfMiddleware` | `@tanstack/react-start` | CSRF protection via same-origin validation (Sec-Fetch-Site, Origin, Referer headers) — registered in `src/start.ts` as `requestMiddleware` |
| `fromCrossJSON` | `seroval` | Decode server function responses (used in fetch interceptor) |
| `getEnv` / `parseEnvTime` | `src/server/utils.ts` | Env var access with math expression support |
| `makeBackendRequest` | `src/server/backend.ts` | Fetch wrapper for Go backend calls |

### Server Function Rules
1. **ESM only** — compiled with `?tss-serverfn-split`, `require()` is NOT available. Always use static `import`.
2. **Static imports at top** — never dynamic `import()` or `require()` inside handler.
3. **Cookie access** — use `setCookie`/`getCookie`/`deleteCookie` from `@tanstack/start-server-core`.
4. **Environment variables** — use `getEnv()` and `parseEnvTime()` from `src/server/utils.ts`. `.env.local` supports math expressions like `10 * 1000` — `parseInt()` silently fails on these (returns `10` instead of `10000`).
5. **Backend calls** — always through `makeBackendRequest()`, never raw `fetch` to backend.
6. **Middleware chaining** — use `.middleware([sessionMiddleware])` for auth-required functions.

### SSR Hydration Rules
1. Zustand persist stores MUST use `skipHydration: true` — call `store.persist.rehydrate()` in `useEffect` after mount.
2. Components depending on browser state use client-only pattern: `useState(false)` + `useEffect(() => setMounted(true))`.
3. `suppressHydrationWarning` on `<html>` and `<body>` tags in `__root.tsx`.
4. `beforeLoad` can call server functions directly for auth checks (e.g., `meFn()` in `admin/_layout.tsx`).

### Dev Logging
- `src/lib/fetchInterceptor.ts` — intercepts `/_serverFn/` requests in browser console
- Decodes server function URL (base64url JSON `{file, export}`) — no TanStack utility for this, custom decoder
- Decodes response body using `fromCrossJSON` from `seroval` — same decoder TanStack Start uses internally

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
├── server/              # Server-side code (runs in Node.js, NOT browser)
│   ├── utils.ts         # getEnv(), parseEnvTime()
│   ├── backend.ts       # makeBackendRequest() — Go backend fetch wrapper
│   ├── session.ts       # Redis session CRUD + RTR token refresh
│   ├── redis.ts         # Redis client singleton
│   ├── functions/       # Server functions (createServerFn)
│   │   ├── auth/        # login, logout, me, change-password
│   │   ├── accounting/  # kasbank, perkiraan, etc.
│   │   ├── admin/       # sessions, users
│   │   └── shared/      # cross-domain (menu, dashboard, etc.)
│   └── middleware/       # session, csrf, auth middleware
├── lib/                 # Client-side utilities
│   ├── fetchInterceptor.ts  # Dev console logger (seroval decode)
│   └── serverFnLogger.ts    # Server-side function logger
├── components/          # UI components
│   ├── ui/              # Atomic design primitives (Shadcn-style, NO Glassmorphism)
│   └── admin/           # Admin-specific components grouped by feature
│       ├── menu/
│       ├── users/
│       ├── perkiraan/
│       └── reports/
├── hooks/               # TanStack Query integration hooks
├── locales/             # i18n translations (en + id)
├── routes/              # TanStack Router (file-based)
├── services/            # Service layer (calls server functions, NOT raw fetch)
├── store/               # Zustand global state (skipHydration: true for persist)
├── types/               # CENTRALIZED TypeScript types
├── utils/               # Pure helpers (errorMapper, etc.)
└── ...                  # api-handlers/ and bff/ deleted (Phase 6 cleanup)
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

## BFF Pattern (DELETED — replaced by Server Functions)

Old `src/api-handlers/` and `src/bff/` directories deleted in Phase 6 cleanup.
All functionality now in `src/server/` (functions, middleware, session, redis).

---

## Error Handling

All API errors funnel through `src/utils/errorMapper.ts` (3-part format: What / Why / Next Steps). Components receive formatted error objects — never raw API errors.

### Server Function Error Handling (MANDATORY pattern)

Every service that wraps a server function **MUST** return the raw `BackendResponse` shape (`{success, status, message, data, error}`) and let the hook decide what to do. Hooks MUST check `response.success` **first** before reading `data`. This was the root cause of the TASK-017 bug (silently swallowed `400 Invalid user ID format` showed as "No active sessions").

**Anti-pattern** (NEVER DO — caused TASK-017):

```typescript
// services/sessionService.ts — BUG
async getUserSessions(userId: string | number): Promise<IAPIResponse<ISessionListResponse>> {
  const result = await getUserSessionsFn({ data: { userId: String(userId) } })
  return { success: true, status: 200, message: 'Success', data: result } as any
  //                          ^^^^^^^^ LIES — result might be { success: false, message: "Invalid user ID format" }
}
```

**Correct pattern** (MUST DO):

```typescript
// services/sessionService.ts — CORRECT
async getUserSessions(userId: string | number): Promise<IAPIResponse<ISessionListResponse>> {
  const result = await getUserSessionsFn({ data: { userId: String(userId) } })
  return result as IAPIResponse<ISessionListResponse>
  // BackendResponse is structurally compatible with IAPIResponse
}
```

```typescript
// hooks/useSessionManagement.ts — CORRECT
const response = await sessionService.getUserSessions(userId)
if (!response.success) {                       // <-- check FIRST
  throw new Error(response.message || 'Failed to fetch sessions')
}
if (!response || !response.data) {             // <-- then check data
  throw new Error('Invalid response format')
}
const data = response.data as ISessionListResponse
return { sessions: data.sessions || [], ... }
```

### Why this pattern matters

- **The 4-field `error_map` from Go middleware** flows through `makeBackendRequest` → server function → `IAPIResponse` unchanged. If the service hardcodes `success: true`, the hook never sees the error.
- **TanStack Start server functions throw, not return**, on network/serialization failures — those go to the catch block. Application-level errors (`{success:false}` from Go) are normal returns, NOT throws. Both paths must converge in the same toast in the UI.
- **The toast lives in the hook's `onError`**, not in the service. The service is dumb; the hook decides UX.

### Reference implementation
- `src/hooks/useSessionManagement.ts` `useUserSessions()` — canonical example (TASK-017 fix).
- `src/hooks/usePermissionManagement.ts` — same pattern, applies to any list/query hook.

---

## Session Storage Contract (Redis) — read before touching sessions

Two key formats, **both required** for session monitoring to work. See `backend/CLAUDE.md` "Session Storage Contract" for the full table; summary of frontend's responsibility:

| Key | Type | Frontend function | Required ops |
|---|---|---|---|
| `bff:session:{sessionId}` | string | `createSession()`, `updateSession()` (refresh path) | SET + EXPIRE |
| `bff:user_sessions:{userId}` | set | `createSession()`, `destroySession()`, `updateSession()` | SADD + EXPIRE / SREM |

`createSession` must `SADD sessionId` AND `EXPIRE` the user-sessions key in the same call. `destroySession` must `getSession` first to learn the userId before SREM. `updateSession` must refresh EXPIRE on the user-sessions key alongside the session key.

Forgetting any of these caused real bugs in TASK-012 / TASK-017. Add a unit test in `src/server/session.test.ts` (Vitest + ioredis-mock) when modifying these functions.

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

### Server Functions
`src/server/functions/admin/users/permissions/{menu,report,coa}.ts`

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
- Server Functions: `src/server/functions/admin/reports/permission-report.ts`

---

## Scope Discipline

**NEVER** modify files in `backend/`. That directory is owned by `@dapen-backend`.
