# DAPEN Frontend

> React 19 + TanStack Start (SSR) + Tailwind v4 + Go Backend

## Quick Start

```bash
cd frontend
npm install
npm run dev           # Dev server at http://localhost:3001
npm run build         # Production build
npm test              # Vitest unit tests
npx playwright test   # E2E tests
npx @tanstack/router-cli generate   # Generate routes after adding new files to src/routes/
```

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | TanStack Start (SSR + Server Functions) |
| **Runtime** | Node.js 20+ LTS, Vite 8 |
| **Language** | TypeScript 6 |
| **UI Library** | React 19 |
| **Routing** | TanStack Router (file-based) |
| **Data Fetching** | TanStack Query |
| **State** | Zustand (global) |
| **Styling** | Tailwind CSS v4 |
| **Components** | shadcn-style primitives (`src/shared/ui/`) + Radix UI |
| **Forms** | React Hook Form + Zod |
| **Rich Text** | TipTap |
| **Charts** | Recharts |
| **Tables** | TanStack Table |
| **i18n** | react-i18next (English + Indonesian) |
| **Linting / Formatting** | Biome |
| **Testing** | Vitest (unit) + Playwright (E2E) |
| **Deployment** | Nitro server adapter |

## Architecture

### Domain + Shared Layout

All code lives under either `shared/` (cross-cutting) or `domains/<name>/` (domain-owned).

```
src/
├── server/              # TanStack Start server-side (functions, middleware, session, redis)
├── shared/              # Cross-cutting: 2+ domains use this
│   ├── api/            # fetchInterceptor, queryClient, apiLogger, errors
│   ├── auth/           # AUTH_KEY, role helpers (isAdmin, isKaryawan)
│   ├── components/      # Shared UI (Navbar, ThemeToggle, LanguageToggle, layout wrappers)
│   ├── hooks/          # useDebounce, usePagination, useMediaQuery, useToast
│   ├── i18n/           # i18next config
│   ├── schemas/         # Shared Zod schemas
│   ├── services/        # Shared services (e.g., sharedFilterService)
│   ├── stores/          # authStore, modalStore, themeStore (Zustand)
│   ├── theme/           # ThemeProvider, theme tokens
│   ├── types/           # Shared types
│   ├── ui/              # shadcn-style primitives (button, dialog, form, table, etc.)
│   └── utils/           # cn(), errorMapper
│
├── domains/              # One folder per business domain
│   ├── auth/            # Login, logout, session management
│   ├── users/           # User CRUD, permissions, sessions
│   ├── menu/            # Sidebar, menu catalogue
│   ├── settings/        # Company, numbering, configuration
│   ├── berkas/          # Document management
│   ├── activity/        # Activity logs
│   ├── accounting/      # Bank accounts, chart of accounts (perkiraan), journals
│   ├── reports/         # Permission reports (matrix, excel, pdf)
│   └── dashboard/       # Dashboard widgets and stats
│   └── [each]/          # components/ hooks/ services/ types/ locales/ stores/
│
├── routes/              # TanStack Router (file-based, auto-generated tree)
└── types/               # Shared TypeScript types (global)
```

**Migration note:** Stale directories (`src/hooks/`, `src/services/`, `src/types/`, `src/store/`, `src/components/admin/`, etc.) are kept as re-export shims so imports in unconverted files keep working. **New code must use `shared/` and `domains/` directly.**

### Server Functions (BFF)

Server functions replace the old BFF API routes. They run server-side and are called via RPC from the browser.

```
src/server/
├── utils.ts              # getEnv(), parseEnvTime()
��── backend.ts            # makeBackendRequest() — fetch wrapper with timeout/logging
├── session.ts            # Redis session CRUD, token refresh with RTR lock
├── redis.ts              # Redis client singleton (ioredis)
├── functions/
│   ├── auth/             # loginFn, logoutFn, meFn
│   ├── admin/            # Admin server functions (users, permissions)
│   ├── accounting/       # Accounting domain functions
│   └── shared/           # Cross-domain functions
└── middleware/
    ├── session.ts        # sessionMiddleware
    ├── csrf.ts           # CSRF middleware
    └── auth.ts           # Auth guard middleware
```

**Server Function Rules:**
1. Always use static `import` — compiled with `?tss-serverfn-split`, `require()` is NOT available.
2. Cookie access: `setCookie`/`getCookie`/`deleteCookie` from `@tanstack/start-server-core`.
3. Env vars: `getEnv()` / `parseEnvTime()` from `src/server/utils.ts`.
4. Backend calls: always through `makeBackendRequest()`, never raw `fetch` to Go backend.
5. Auth-required functions: `.middleware([sessionMiddleware])`.

### Data Flow

```
Component → Domain Service (calls server function) → Hook (TanStack Query) → Component
```

- All network I/O lives in `src/domains/*/services/`
- Hooks wrap services with TanStack Query cache management
- UI components are pure presentational — never call server functions directly

## Mandatory Checklist

- [ ] **NO new code in flat dirs** (`src/hooks/`, `src/services/`, `src/types/`, `src/store/`). Use `shared/` or `domains/<name>/`.
- [ ] **3+ domain usage → promote to `shared/`**.
- [ ] Use components from `src/shared/ui/` when they already exist.
- [ ] **NO Glassmorphism.** Solid surfaces only.
- [ ] All forms use `react-hook-form` + `zod` via `<Form>`.
- [ ] No `axios`/`fetch` in components. Use `services/` via `hooks/`.
- [ ] All errors go through `src/shared/utils/errorMapper.ts`. Components MUST NOT format errors.
- [ ] All user-facing strings use `useTranslation()`. Update `en` AND `id` together.
- [ ] **NO page-specific headers.** `MainHeader.tsx` owns page title.
- [ ] **Skeleton mandatory.** All loading states use `<Skeleton />` — no plain spinners for layout loading.
- [ ] **NProgress top bar** triggered for all API fetching.
- [ ] Submit buttons use inline spinner via `loading={...}` on `<Button>`.
- [ ] Use `<Each />` and `<Show />` from `src/shared/ui/layout/Render.tsx` for lists and conditionals. No raw `.map()`, `&&`, or ternary in TSX return.
- [ ] Zustand stores use `skipHydration: true` + `store.persist.rehydrate()` in `useEffect`.

## Key Patterns

### Error Handling

All API errors funnel through `src/shared/utils/errorMapper.ts` (3-part format: What / Why / Next Steps).

**Server function services MUST return raw `BackendResponse`** and let hooks decide what to do:

```typescript
// ✅ Correct — service returns raw response
const result = await getUserSessionsFn({ data: { userId: String(userId) } })
return result as IAPIResponse<ISessionListResponse>

// ❌ Wrong — hardcoding success:true hides errors from the hook
return { success: true, status: 200, message: 'Success', data: result } as any
```

Hooks check `response.success` **first** before reading `data`.

### Loading States

| Scenario | Pattern |
|---|---|
| Layout / page loading | `<Skeleton />` (never plain "Loading..." text) |
| Button submit | `<Button loading={isPending}>Save</Button>` |
| API fetch | NProgress top progress bar |

### Role-Based Routing

- Admin routes: `/admin/*` (protected by `beforeLoad` guard)
- Karyawan routes: `/karyawan/*` (protected by `beforeLoad` guard)

### i18n

```typescript
const { t } = useTranslation()
<p>{t('permissions.fields.read')}</p>
```

Always update `locales/en/` AND `locales/id/` together.

## Testing

```bash
npm test                         # Vitest unit tests (no watch)
npm test -- --watch              # Vitest watch mode
npx playwright test              # E2E tests
npx playwright test --headed     # E2E with visible browser
```

- Unit tests: co-located as `*.test.ts` / `*.test.tsx`
- E2E tests: `e2e/` directory using Playwright
- Selectors: use `aria-label` or role attributes (i18n-safe)
- Wait for `<Skeleton />` to disappear before interacting in E2E tests

## Deployment

Built output is deployed via Nitro server adapter:

```bash
npm run build
node dist/server/index.mjs
```

The build produces a self-contained Node server. Deploy `dist/` to any Node-compatible host (Render, Fly.io, VPS, etc.).

## Linting & Quality

```bash
npm run check     # Biome lint + format check
npm run lint      # Biome lint only
npm run format    # Biome format fix
```

Run the full quality gate from project root:

```bash
./scripts/check-all.sh --frontend-only
```

## Troubleshooting

### Route changes not reflected

Run `npm run generate-routes` (or `npx @tanstack/router-cli generate`) after adding new files to `src/routes/`.

### Port 3001 in use

Dev server defaults to port `3001`. Change via: `vite dev --port 3000`

### Hydration warnings

Ensure Zustand stores use `skipHydration: true` and rehydrate in `useEffect`. Check that components using browser-only APIs (window, localStorage) use the client-only pattern: `useState(false)` + `useEffect(() => setMounted(true))`.

---

**Status**: Active Development 🚀

For detailed development conventions, see [frontend/CLAUDE.md](./CLAUDE.md).
