# CLAUDE.md — DAPEN Project Root

## Architecture Model

- **Backend:** Domain-Based + DDD-Lite + Layered (handler → service → repository → entity per domain)
- **Frontend:** Strict Separation of Concerns (Types → Services → Hooks → Components)
- **Pattern:** BFF (Backend for Frontend) via `frontend/src/api-handlers/`; JWT held in HttpOnly cookies

---

## RULE #0: Delegation (CRITICAL)

**YOU ARE THE ARCHITECT, NOT THE BUILDER.**

Always delegate implementation to specialized agents:
- Backend work → `@dapen-backend`
- Frontend work → `@dapen-frontend`
- E2E / QA → `@dapen-qa`

Do direct work only for: quick reads, 1-2 line edits, simple shell commands, agent coordination.

---

## Core Rules

1. **ENGLISH MANDATORY** — All code, comments, and `.md` files in English. No Indonesian in code or docs.
2. **MANDATORY TESTING** — Create E2E (Playwright) + Unit tests for every new feature or code change. TDD encouraged.
3. **No duplicate code** — Abstract shared logic into `utils/` or `hooks/`.
4. **Read before write** — Always read files before editing.
5. **Prefer edit over create** — Modify existing files when possible.
6. **No unsolicited docs** — Only create documentation when explicitly asked.
7. **Never commit secrets** — No API keys, passwords, or sensitive data.
8. **Use existing patterns** — Follow Domain-Based architecture and BFF conventions.
9. **One feature per task** — Create a separate task file in `tasks/` per distinct feature before starting. Do not combine unrelated features.
10. **Verify compilation** — Go code MUST compile with zero errors before handoff.
11. **Mandatory runtime verification** — React app MUST run without errors on all pages with all data scenarios. `npm run type-check` must pass.
12. **Design system enforcement** — Use ONLY components from `frontend/src/components/ui`. NO Glassmorphism.
13. **Complete resolution only** — Never stop at "good enough".
14. **Progressive quality gates** — Verify quality continuously, not just at completion.
15. **Update feature CLAUDE.md** — When changing ANY feature code, update its contextual `CLAUDE.md` in the SAME commit.
16. **BATCH ERROR COLLECTION (MANDATORY)** — NEVER run individual checks one-by-one and fix in a loop. ALWAYS run `./scripts/check-all.sh` first to collect ALL errors into `tmp/` in one pass, then fix in batch.
17. **DATA RENDERING (MANDATORY)** — All UI components MUST use `<Each />` and `<Show />` from `frontend/src/components/ui/layout/Render.tsx`. Do NOT use raw `.map()`, `&&`, or `? :` ternaries in TSX return blocks.

---

## Tech Stack

**Backend:** Go 1.20+ · Gin · GORM · SQL Server (legacy) · MongoDB · Redis · JWT · Swaggo/Swagger

**Frontend:** React 18+ · Vite 5 · TypeScript 5 · TanStack Router · TanStack Query · Zustand · Tailwind v4 · react-i18next

---

## Project Structure

```
dapen-golang-next/
├── .claude/
│   ├── agents/          # Subagent manifests (dapen-backend, dapen-frontend, dapen-qa)
│   ├── skills/          # Skill definitions (build-check, e2e-runner, scaffolding)
│   ├── commands/        # Slash commands (architect, verify)
│   ├── hooks/           # auto-check.sh
│   └── settings.json
├── tasks/               # Task tracking (TASK-XXX-*.md)
│   └── CLAUDE.md        # Task lifecycle & templates
├── frontend/
│   ├── CLAUDE.md        # Frontend quick reference
│   └── src/
│       ├── api-handlers/ # BFF routes (server-side)
│       ├── bff/          # BFF infra (dispatcher, session, redis, csrf)
│       ├── components/   # UI atoms + admin-specific components
│       ├── hooks/        # TanStack Query hooks
│       ├── locales/      # i18n (en + id)
│       ├── routes/       # TanStack Router (file-based)
│       ├── services/     # API integration layer
│       ├── store/        # Zustand global state
│       ├── types/        # Centralized TypeScript types
│       └── utils/        # Pure helpers (errorMapper, etc.)
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

## Quality Verification

```bash
# MANDATORY: Run this FIRST before any individual check or fix
./scripts/check-all.sh               # All checks (backend + frontend)
./scripts/check-all.sh --backend-only
./scripts/check-all.sh --frontend-only

# After run, read all errors at once:
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

### Frontend
- All types in `src/types/` (prefix: `I` interface, `T` type, `P` props)
- No `axios`/`fetch` in components — use `src/services/` via TanStack Query hooks
- All errors through `src/utils/errorMapper.ts`
- All user-facing strings via `useTranslation()` — update `locales/en` AND `locales/id` together

---

## Slash Commands

- `/architect TASK-XXX` — Orchestrate full feature (backend → frontend → QA feedback loop)
- `/verify` — Run comprehensive quality verification
