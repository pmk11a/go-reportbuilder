# CLAUDE.md — DAPEN Project Root

## Architecture Model

- **Backend:** Domain-Based + DDD-Lite + Layered (handler → service → repository → entity per domain)
- **Frontend:** Strict Separation of Concerns (Types → Services → Hooks → Components)
- **Pattern:** Server Functions (TanStack Start) via `frontend/src/server/functions/`; JWT held in Redis sessions, session ID in HttpOnly cookies

---

## RULE #0: Plan Mode Before Implementation (CRITICAL)

**NEVER start editing code for large work without Plan Mode approval.**

| Request type | Requires Plan Mode? |
|---|---|
| Migrasi framework/teknologi | ✅ WAJIB — enter plan mode, get user approval, THEN edit |
| Feature baru | ✅ WAJIB |
| Refactor besar (>4h) | ✅ WAJIB |
| Bug fix / cleanup ringan | ❌ Langsung |

**After plan is approved → create/update task file FIRST → then start coding.**

Violation of this rule = immediate revert + self-improve.

---

## RULE #1: Delegation (CRITICAL)

**YOU ARE THE ARCHITECT, NOT THE BUILDER.**

Always delegate implementation to specialized agents:
- Backend work → `@dapen-backend`
- Frontend work → `@dapen-frontend`
- E2E / QA → `@dapen-qa`

Do direct work only for: quick reads, 1-2 line edits, simple shell commands, agent coordination.

---

## RULE #2: Auto Self-Improvement (MANDATORY)

> Full specification: `RULES.md` §7 (global, berlaku semua project Mamorasoft)

After every bug fix, error resolution, or pattern discovery — **automatically evaluate** whether skills/agents need updating. Propose changes; user confirms before write.

---

## Core Rules

1. **ENGLISH MANDATORY** — All code, comments, and `.md` files in English. No Indonesian in code or docs.
2. **MANDATORY TESTING** — Create E2E (Playwright) + Unit tests for every new feature or code change. TDD encouraged.
3. **No duplicate code** — Abstract shared logic into `utils/` or `hooks/`.
4. **Read before write** — Always read files before editing.
5. **Prefer edit over create** — Modify existing files when possible.
6. **No unsolicited docs** — Only create documentation when explicitly asked.
7. **Never commit secrets** — No API keys, passwords, or sensitive data.
8. **DILARANG GIT COMMAND TANPA PERINTAH** — `git stash`, `git stash drop`, `git checkout`, `git commit`, `git push` — JANGAN PERNAH dijalankan tanpa perintah eksplisit dari user, termasuk saat auto-edit mode aktif atau bypass permission on. Tidak ada pengecualian.
8. **Use existing patterns** — Follow Domain-Based architecture and TanStack Start server function conventions.
9. **One feature per task** — Create a separate task file in `tasks/` per distinct feature before starting. Do not combine unrelated features.
10. **Verify compilation** — Go code MUST compile with zero errors before handoff.
11. **Mandatory runtime verification** — React app MUST run without errors on all pages with all data scenarios. `npm run type-check` must pass.
12. **Design system enforcement** — Use ONLY components from `frontend/src/components/ui`. NO Glassmorphism.
13. **Complete resolution only** — Never stop at "good enough".
14. **Progressive quality gates** — Verify quality continuously, not just at completion.
15. **Update feature CLAUDE.md** — When changing ANY feature code, update its contextual `CLAUDE.md` in the SAME commit.
16. **BATCH ERROR COLLECTION (MANDATORY)** — When the user needs a quality-gate run, NEVER run individual checks one-by-one and fix in a loop. The user runs `./scripts/check-all.sh` and shares the output; agents read the batched artifacts in `tmp/latest/*` and group errors by file before fixing. **Agents and skills MUST NOT execute `check-all.sh` (or any build/test/type-check/lint/codegen) themselves** — see global RULES.md §2.
17. **DATA RENDERING (MANDATORY)** — All UI components MUST use `<Each />` and `<Show />` from `frontend/src/components/ui/layout/Render.tsx`. Do NOT use raw `.map()`, `&&`, or `? :` ternaries in TSX return blocks.

---

## Tech Stack

**Backend:** Go 1.20+ · Gin · GORM · SQL Server (legacy) · MongoDB · Redis · JWT · Swaggo/Swagger

**Frontend:** React 19 · TanStack Start (SSR + Server Functions) · TanStack Router · TanStack Query · Zustand · Tailwind v4 · react-i18next

---

## Project Structure

```
dapen-golang-next/
├── .claude/
│   ├── agents/          # Subagent manifests (dapen-backend, dapen-frontend, dapen-qa)
│   ├── skills/          # Skill definitions (scaffolding)
│   ├── commands/        # Slash commands (architect)
│   └── settings.json
├── tasks/               # Task tracking (TASK-XXX-*.md)
│   └── CLAUDE.md        # Task lifecycle & templates
├── frontend/
│   ├── CLAUDE.md        # Frontend quick reference
│   └── src/
│       ├── server/       # Server-side (functions, middleware, session, redis)
│       ├── lib/          # Client utilities (fetchInterceptor, query-client)
│       ├── components/   # UI atoms + admin-specific components
│       ├── hooks/        # TanStack Query hooks
│       ├── locales/      # i18n (en + id)
│       ├── routes/       # TanStack Router (file-based)
│       ├── services/     # Service layer (calls server functions)
│       ├── store/        # Zustand global state (skipHydration for persist)
│       ├── types/        # Centralized TypeScript types
│       ├── utils/        # Pure helpers (errorMapper, etc.)
│       └── ...            # api-handlers/ and bff/ deleted (Phase 6)
├── backend/
│   ├── CLAUDE.md        # Backend quick reference
│   ├── cmd/             # Entry point (main.go)
│   └── internal/
│       ├── shared/      # Technical concerns (auth, cache, db, response, middleware...)
│       ├── identity/    # Domain: user, permission, auth
│       ├── accounting/  # Domain: perkiraan, periode, jurnal
│       ├── menu/        # Domain: master menu catalogue
│       ├── reports/     # Domain: permission_report
│       └── ...
└── scripts/
    └── check-all.sh     # MANDATORY quality gate
```

---

## Database Migrations (CRITICAL)

- **NEVER** use GORM `AutoMigrate` at runtime.
- **ALWAYS** use CLI flags:
  ```bash
  cd backend && go run cmd/main.go --migrate   # Apply schema changes
  cd backend && go run cmd/main.go --seed      # Seed initial data
  ```
- **Legacy tables** (from Laravel): Do NOT add `CreatedAt`/`UpdatedAt` or change primary keys.

---

## Quality Verification (USER-RUN ONLY)

> Per global RULES.md §2, **agents and skills MUST NOT execute any of these commands** — including `check-all.sh`, `go build`, `go test`, `npm run type-check`, `npm test`, `npx playwright test`, `swag init`, `npx @tanstack/router-cli generate`, `npm run dev`, `go run`. The user runs the quality gate and shares the output.

```bash
# User runs (the agent must NOT run these):
./scripts/check-all.sh               # All checks (backend + frontend)
./scripts/check-all.sh --backend-only
./scripts/check-all.sh --frontend-only

# Agent reads the batched output the user shared:
cat tmp/latest/*_errors.log
cat tmp/latest/check_report.md
```

---

## Server Startup

```bash
# Backend
cd backend && go run ./cmd/main.go

# Frontend
cd frontend && npm run dev
```

---

## Testing

```bash
# Backend
cd backend && go test ./... -v
cd backend && go test -coverprofile=coverage.out ./...

# Frontend
cd frontend && npm test -- --run          # Vitest unit tests
cd frontend && npx playwright test        # E2E tests
```

---

## Caching & Rate Limiting

| Endpoint Type | Cache? | TTL |
|---|---|---|
| Static data (`/menus/sidebar`, config, locales) | Yes | 1 hour |
| Heavy aggregate data (`/dashboard/stats`) | Yes | 5–10 min |
| Semi-static lists (`/users`, `/periode`) | Yes | 30s–1min |
| User profile (`/api/me`) | Yes (userId in key) | 5 min |
| Write ops (POST/PUT/DELETE) | **No** | — |
| Auth flows (`/auth/login`, `/auth/refresh`) | **No** | — |

Cache key format:
- Global: `cache:global:[feature]:[endpoint]`
- User-scoped: `cache:user:[userId]:[feature]:[endpoint]`

Rate limiter: Redis-backed Token Bucket (atomic Lua). Emit `X-RateLimit-Limit/Remaining/Reset`. Fail-open if Redis is down.

---

## Task Status Format

```
📋 TODO | ⏳ IN_PROGRESS - Month Day, Year | ✅ COMPLETED - Month Day, Year
❌ BLOCKED - Month Day, Year | 🔄 SUCCEEDED_BY: TASK-XXX - Month Day, Year
```

See `tasks/CLAUDE.md` for full task lifecycle documentation.

---

## Architecture Patterns (Summary)

### Backend
- Layered per domain: `handler.go` → `service.go` → `repository.go` → `entity.go`
- Handler MUST NOT call repository directly
- All API responses via `internal/shared/response/` helpers — never `c.JSON(...)` directly
- Response envelope: `{ "success": true, "status": 200, "message": "...", "data": {...} }`

### Frontend (TanStack Start)
- **Server functions** in `src/server/functions/` — `createServerFn` from `@tanstack/react-start`
- Cookie management: `setCookie`/`getCookie`/`deleteCookie` from `@tanstack/start-server-core`
- Server functions compile to ESM — always static `import`, never `require()`
- Backend calls: `makeBackendRequest()` from `src/server/backend.ts`
- Env vars: `getEnv()` / `parseEnvTime()` from `src/server/utils.ts`
- SSR hydration: Zustand persist uses `skipHydration: true`, rehydrate in `useEffect`
- Client-only pattern: `useState(false)` + `useEffect(() => setMounted(true))` for browser state
- All types in `src/types/` (prefix: `I` interface, `T` type, `P` props)
- No `axios`/`fetch` in components — use `src/services/` via TanStack Query hooks
- All errors through `src/utils/errorMapper.ts`
- All user-facing strings via `useTranslation()` — update `locales/en` AND `locales/id` together
- Response decode (dev logging): `fromCrossJSON` from `seroval` — no custom decoder needed

---

## Slash Commands

- `/architect TASK-XXX` — Orchestrate full feature (backend → frontend → QA). The orchestrator only **reviews** artifacts the user ran; it never executes `check-all.sh` itself.
