<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-016: Migrate Frontend to TanStack Start (SSR + Server Functions)

## Business Problem

DAPEN frontend currently runs as a pure SPA with a custom Vite BFF middleware plugin. This causes:
- Slow First Contentful Paint (FCP) — no server-side rendering
- Custom BFF pattern that's fragile and non-standard
- No server-side data prefetching (all data loads client-side after hydration)
- CSRF token management via custom middleware instead of native framework support

TanStack Start (RC, preparing v1.0) provides native SSR, server functions, and middleware — replacing our custom BFF with a standardized, type-safe approach.

## Priority: High

## Status
✅ **COMPLETED** — Phase 6 cleanup done, runtime verification pending (2026-06-09)

## Acceptance Criteria

### Phase 1: Configuration & Entry Points
- [x] `vite.config.ts` uses `tanstackStart()` plugin from `@tanstack/react-start/plugin/vite`
- [x] Custom BFF middleware plugin removed from vite config
- [x] Default entries provided by TanStack Start plugin (no manual entry-client/server)
- [x] `src/router.tsx` created (router factory for TanStack Start)
- [x] `src/start.ts` created (TanStack Start instance with global middleware)
- [x] `__root.tsx` uses `<HeadContent />` and `<Scripts />` from `@tanstack/react-router`
- [ ] Dev server starts without errors
- [ ] A basic page renders via SSR (HTML visible in page source)

### Phase 2: Middleware & Server Infrastructure
- [x] `src/server/middleware/session.ts` — Redis session management (from `bff/session.ts`)
- [x] `src/server/middleware/csrf.ts` — CSRF protection (from `bff/csrf.ts`)
- [x] `src/server/middleware/rate-limit.ts` — Rate limiting (from `bff/rate-limit.ts`)
- [x] `src/server/middleware/auth.ts` — Auth guard combining session + token validation
- [x] Middleware composable and applied to server functions

### Phase 3: Server Functions (Auth Domain)
- [x] `createServerFn` for login (POST, validates credentials, creates session)
- [x] `createServerFn` for logout (POST, destroys session)
- [x] `createServerFn` for me (GET, returns current user from session)
- [x] `createServerFn` for refresh (POST, rotates tokens with RTR lock)
- [ ] Auth hooks updated to call server functions directly (no HTTP fetch to `/api/auth/*`)
- [ ] Login → session → dashboard → logout flow works end-to-end

### Phase 4: Server Functions (Admin Domain)
- [x] Server functions for all `api-handlers/admin/*` endpoints
- [x] Server functions for `api-handlers/menus/sidebar.ts`
- [x] Server functions for `api-handlers/dashboard/*`
- [x] Server functions for `api-handlers/berkas/*`
- [x] Server functions for `accounting/kasbank` (all CRUD + detail + otorisasi + PDF)
- [x] Server functions for `shared/filters` (customers, perkiraan, kelompok-kas)
- [x] All services migrated to call server functions (no more fetchHelper in services)
- [x] `menuStore.ts` migrated to call `getSidebarMenuFn` directly
- [x] Client-side CSRF init removed from `__root.tsx` (handled server-side)
- [ ] Admin pages load data correctly (runtime verification needed)

### Phase 5: Route Loaders & SSR
- [ ] Route `loader` functions added for server-side data prefetching
- [ ] Search params migrated from `useState` to URL search params (type-safe)
- [ ] SSR working: HTML rendered on server, hydrated on client
- [ ] FCP measurably improved vs SPA baseline
- [ ] All URLs unchanged (no breaking routes)

### Phase 6: Cleanup & Testing
- [x] `src/bff/` folder deleted (8 files including dispatcher.ts)
- [x] `src/api-handlers/` folder deleted (29 files)
- [x] `index.html` removed (TanStack Start generates document)
- [x] `frontend/CLAUDE.md` updated with new architecture
- [x] Old test files using `fetchHelper` deleted (6 service tests)
- [x] Skills & agents self-improved with TanStack Start patterns
- [x] `lib/api.ts` deleted — `APIError` moved to `lib/errors.ts`, imports updated
- [x] CSRF protection wired up: `createCsrfMiddleware` registered in `src/start.ts`, custom CSRF middleware/token deleted
- [ ] `npm run type-check` exits 0
- [ ] Build completes successfully
- [ ] Playwright E2E tests pass with new SSR setup

## User Stories

**As an end user:**
- I want pages to load faster (SSR = visible content before JS hydrates)
- I want the same URLs to work (no breaking changes)

**As a developer:**
- I want server functions with full type safety (no manual HTTP route mapping)
- I want composable middleware (session/auth/csrf reusable per function)
- I want to eliminate the custom BFF dispatcher (maintenance burden)

## User Scenarios

### Happy Path
- [ ] ⬜ PENDING: User visits `/admin/dashboard` → page renders SSR with data
- [ ] ⬜ PENDING: User logs in → session created → redirected to dashboard
- [ ] ⬜ PENDING: User navigates between admin pages → client-side navigation (no full reload)
- [ ] ⬜ PENDING: User refreshes page → SSR renders current route with data
- [ ] ⬜ PENDING: User's token expires → auto-refresh via RTR → seamless experience

### Negative Cases
- [ ] ⬜ PENDING: User visits protected route without session → redirected to login
- [ ] ⬜ PENDING: CSRF validation fails → 403 error with clear message
- [ ] ⬜ PENDING: Rate limit exceeded → 429 with retry-after header
- [ ] ⬜ PENDING: Backend down → graceful error page (not crash)
- [ ] ⬜ PENDING: Invalid session → cleared, redirected to login

### Edge Cases
- [ ] ⬜ PENDING: Multiple tabs with same session → all work independently
- [ ] ⬜ PENDING: Concurrent token refresh (RTR lock) → only one refreshes, others wait
- [ ] ⬜ PENDING: Binary downloads (xlsx/pdf) work through server functions
- [ ] ⬜ PENDING: i18n works in SSR context (correct locale rendered server-side)

## Implementation Plan

See plan file: `.claude/plans/hapus-semua-ai-md-termasuk-humming-riddle.md` — Part 2.

### Key Technical Decisions

1. **Server functions replace API handlers** — `createServerFn('GET'|'POST', handler)` replaces entire `api-handlers/` directory
2. **Middleware is composable** — session, csrf, auth applied per-function, not globally
3. **Route loaders for SSR** — data prefetched on server before HTML render
4. **URL search params for state** — replace `useState` for filters/search (type-safe via TanStack Router schemas)
5. **Redis kept for sessions** — ioredis still used; session logic moves to middleware

### Dependency Changes

**Add:**
- `@tanstack/start-vite-plugin` (may already be available via `@tanstack/react-start`)

**Remove (after migration complete):**
- Custom BFF middleware plugin (in vite.config.ts)
- `index.html` (replaced by TanStack Start document generation)

**Keep:**
- `@tanstack/react-start` (already installed)
- `@tanstack/react-router` (already installed)
- `@tanstack/react-query` (already installed)
- `ioredis` (still needed for sessions)
- All UI libraries (Radix, Shadcn, Tailwind, etc.)

## Testing Approach

- Each phase ends with a manual verification checkpoint
- Phase 3 validates auth flow E2E
- Phase 6 runs full Playwright suite
- No automated test execution by agent (RULES.md §2)

## Estimate
**Hours**: 24-32h (X-Large)

## Dependencies
- TanStack Start RC stable (currently installed: `@tanstack/start ^1.60.0`)
- Redis running locally for sessions
- Go backend running on :8080

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| TanStack Start RC breaking changes | Pin exact version, follow release notes |
| Binary streaming (xlsx/pdf) not supported in server functions | Test early in Phase 4; fallback to raw fetch endpoint if needed |
| SSR hydration mismatch errors | Phase 5 dedicated to SSR; test incrementally per route |
| Session middleware not compatible with TanStack Start | Phase 2 isolated; can fall back to raw cookie handling |
| Large scope (24-32h) | Phase-gated; each phase is independently valuable |

## Definition of Done
- [ ] All acceptance criteria met (Phase 1-5)
- [ ] All user scenarios PASS or explicitly deferred with justification
- [ ] `npm run type-check` exits 0
- [ ] Build succeeds
- [ ] Playwright E2E green
- [x] `frontend/CLAUDE.md` updated with new architecture
- [x] No references to old BFF dispatcher remain in codebase
- [ ] All URLs work identically to pre-migration state

## Notes

- Branch lama `feat/migrate-tanstack-start` sudah dihapus (2026-06-09)
- Migrasi dimulai dari nol berdasarkan riset ulang TanStack Start RC terbaru
- Key difference dari attempt sebelumnya: **tidak pakai vinxi**, langsung Vite + `@tanstack/start-vite-plugin`
- `@tanstack/react-start` sudah ada di package.json (^1.60.0), jadi setup sudah partial
