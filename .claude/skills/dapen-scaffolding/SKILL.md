---
name: dapen-scaffolding
description: Step-by-step procedure for scaffolding a new full-stack feature in the DAPEN project. Use this skill whenever the user asks to create a new feature, add a new entity, or extend an existing module across backend + frontend. Enforces the 6-phase layering (DB → Business → Delivery → FE Integration → FE UI → QA) and the per-feature CLAUDE.md convention. Also applies to migrations and large refactors.
---

# DAPEN Feature Scaffolding Workflow

When asked to scaffold or create a new feature, migration, or large refactor end-to-end, follow this 6-phase sequence strictly. Each phase has a hand-off point — never skip ahead.

**Scope:** This skill applies to:
- New features (endpoint + UI)
- Framework migrations (e.g., Vite → TanStack Start)
- Large refactors (>4h estimated)
- Any plan-approved work that touches backend + frontend

**Before you start**, read:
- `CLAUDE.md` (root) — core rules
- `backend/CLAUDE.md` — backend patterns
- `frontend/CLAUDE.md` — frontend patterns
- `tasks/TASK-XXX-*.md` — the feature's spec (if it exists; otherwise create one per `tasks/CLAUDE.md`)

## Phase 1 — Backend Database
1. Create the GORM model in `backend/internal/<domain>/<sub>/entity.go` with prefix `S` (e.g., `SInvoice`). Implement `TableName() string`.
2. Define the Repository interface (`I*Repository`) and implementation in the same domain folder.
3. **Legacy tables warning:** Do NOT add `CreatedAt`/`UpdatedAt` or change primary keys on legacy SQL Server tables. For new entities, follow standard GORM conventions.
4. After this phase, tell user to run: `cd backend && go build ./...`

## Phase 2 — Backend Business
1. Define DTOs in `backend/internal/<domain>/<sub>/dto.go` for HTTP requests and responses.
2. Define the Service interface (`I*Service`) and implementation.
3. Write a **unit test** for the service using mocks (testify + go-sqlmock).
4. After this phase, tell user to run: `cd backend && go test ./internal/...`

## Phase 3 — Backend Delivery
1. Create the Handler in the domain folder. Use the standard envelope via `shared/response/` helpers — never `c.JSON` directly.
2. Add **Swaggo/Swagger annotations** above every handler method.
3. Register routes in `<domain>/<sub>/routes.go` (apply middleware: auth, role guards, rate limit).
4. After this phase, tell user to run: `cd backend && go build ./... && swag init`

## Phase 4 — Frontend Integration
1. Define TypeScript interfaces in `frontend/src/types/` (prefix `I` for interfaces, `T` for types). No `any`.
2. Create server functions in `frontend/src/server/functions/` using `createServerFn` (TanStack Start pattern).
3. Wrap in TanStack Query hooks in `frontend/src/hooks/`.
4. After this phase, tell user to run: `cd frontend && npm run type-check`

## Phase 5 — Frontend UI
1. Create UI components in `frontend/src/components/`. Use atomic design — check `src/components/ui` first. **NO Glassmorphism.**
2. Use `<Each />` and `<Show />` from `Render.tsx`. No raw `.map()` / `&&` / `? :` in TSX return.
3. Map routes in TanStack Router under `frontend/src/routes/`. Tell user to run `npx @tanstack/router-cli generate` after.
4. Wire error handling through `frontend/src/utils/errorMapper.ts`.
5. Add strings to BOTH `locales/en/*.json` and `locales/id/*.json` via `useTranslation()`.
6. Use `<Skeleton />` and `<Loader2 />` for loading states. No flat "Loading…".
7. After this phase, tell user to run: `cd frontend && npm run type-check`

## Phase 6 — Testing (QA)
1. Write backend unit tests adjacent to source: `[filename]_test.go`.
2. Write backend E2E in `backend/tests/e2e/[feature]_e2e_test.go`.
3. Write frontend unit/component tests co-located: `[filename].test.tsx`.
4. Write Playwright E2E in `frontend/e2e/[feature].spec.ts`. Select by `aria-label`/role. Wait for Skeleton to disappear.
5. Update task file's acceptance criteria with emoji checklist.
6. After this phase, tell user to run: `./scripts/check-all.sh`

## Documentation: Per-Feature CLAUDE.md
Every feature folder gets its own `CLAUDE.md` if complexity warrants it. Update in the SAME commit as code changes.

## No-Run Rule (CRITICAL)
**NEVER run any build, dev, test, or quality gate commands yourself.** After each phase, tell the user exactly which commands to run manually. See RULES.md §2 for the full list of forbidden commands.

## Commit Cadence
- Commit code + documentation together.
- Tell user to run quality gate before each commit.

## Agent Delegation
- Phases 1–3: `@dapen-backend`
- Phases 4–5: `@dapen-frontend`
- Phase 6: `@dapen-qa`
