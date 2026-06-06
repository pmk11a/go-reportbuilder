---
name: dapen-scaffolding
description: Step-by-step procedure for scaffolding a new full-stack feature in the DAPEN project. Use this skill whenever the user asks to create a new feature, add a new entity, or extend an existing module across backend + frontend. Enforces the 6-phase layering (DB → Business → Delivery → FE Integration → FE UI → QA) and the per-feature AI.md convention.
---

# DAPEN Feature Scaffolding Workflow

When asked to scaffold or create a new feature end-to-end, follow this 6-phase sequence strictly. Each phase has a hand-off point — never skip ahead.

**Before you start**, read:
- `AI.md` (root) — 17 rules
- `.gemini/ARCHITECTURE.md` — patterns
- `tasks/TASK-XXX-*.md` — the feature's spec (if it exists; otherwise create one per `tasks/AI.md`)

## Phase 1 — Backend Database
1. Create the GORM model in `backend/internal/infrastructure/persistence/models/` with prefix `S` (e.g., `SInvoice`). Implement `TableName() string`.
2. Define the Repository interface (`I*Repository`) and implementation in `backend/internal/features/<domain>/<sub>/`.
3. **Legacy tables warning:** Do NOT add `CreatedAt`/`UpdatedAt` or change primary keys on legacy SQL Server tables (the `db*.go` models). For new entities, follow standard GORM conventions.
4. After this phase: `cd backend && go build ./...` should be green.

## Phase 2 — Backend Business
1. Define DTOs in `backend/internal/features/<domain>/<sub>/` for HTTP requests and responses. Do not declare request/response structs in handler files.
2. Define the Service interface (`I*Service`) and implementation in `backend/internal/features/<domain>/<sub>/`.
3. Write a **unit test** for the service using mocks (mockery + testify).
4. After this phase: `cd backend && go test ./internal/features/...` should be green.

## Phase 3 — Backend Delivery
1. Create the Handler in `backend/internal/features/<domain>/<sub>/`. Use the standard envelope — `utils.Success` / `utils.Error` / etc. — never `c.JSON` directly.
2. Add **Swaggo/Swagger annotations** above every handler method.
3. Register routes in `backend/internal/app/routes/routes.go` (and apply the right middleware: `AuthMiddleware`, role guards, rate limit).
4. Run `swag init` to regenerate `backend/docs/`.
5. After this phase: `cd backend && go build ./...` AND `./scripts/check-all.sh --backend-only` should be green.

## Phase 4 — Frontend Integration
1. Define TypeScript interfaces in `frontend/src/types/` (use prefix `I` for interfaces, `T` for types). No `any`.
2. Create API fetch functions in `frontend/src/services/`. **Do not** fetch from components.
3. Wrap fetch functions in TanStack Query hooks in `frontend/src/hooks/`.
4. Update BFF handlers in `frontend/src/api-handlers/` if the new endpoint needs request/response shaping or token refresh logic.
5. After this phase: `cd frontend && npm run type-check` should be green.

## Phase 5 — Frontend UI
1. Create UI components in `frontend/src/components/`. Use atomic design — always check `frontend/src/components/ui` first. **NO Glassmorphism** — Shadcn-style solid surfaces only.
2. For lists/conditionals, use `<Each />` and `<Show />` from `frontend/src/components/ui/layout/Render.tsx`. No raw `.map()` / `&&` / `? :` in the primary TSX return.
3. Map routes in TanStack Router under `frontend/src/routes/`. Run `npx @tanstack/router-cli generate` after creating/deleting route files.
4. Wire error handling through `frontend/src/utils/errorMapper.ts` (3-part: What / Why / Next Steps). Never format errors in the component.
5. Add page-level strings to **both** `frontend/src/locales/en/*.json` and `frontend/src/locales/id/*.json` via `useTranslation()`. No hardcoded text.
6. Use `<Skeleton />` and `<Loader2 />` for loading states. No flat "Loading…".
7. After this phase: `cd frontend && npm run type-check` AND `./scripts/check-all.sh --frontend-only` should be green.

## Phase 6 — Testing (QA)
1. Write backend unit tests adjacent to source: `[filename]_test.go` (e.g., `user_handler_test.go`).
2. Write backend E2E in `backend/tests/e2e/[feature]_e2e_test.go` for full router flows.
3. Write frontend unit/component tests co-located: `[filename].test.tsx`.
4. Write Playwright E2E in `frontend/e2e/[feature].spec.ts`. Select by `aria-label`/role (i18n-safe). Wait for `<Skeleton>`/`<Loader2>` to disappear.
5. Update the task file's `## Acceptance Criteria` with emoji checklist:
   - `- [x] ✅ PASS: <scenario>`
   - `- [x] ❌ FAIL: <scenario>`
   - `- [ ] ⬜ PENDING: <scenario>`
6. After this phase: `./scripts/check-all.sh` exits 0; coverage_tested ≥80%; critical E2E flows green.

## Documentation: Per-Feature AI.md
Per `AI.md` rule #15 and `tasks/AI.md` §"Feature AI.md Maintenance", every feature folder gets its own `AI.md`. Use `.templates/FEATURE_AI_TEMPLATE.md` as the skeleton. Sections: 🎯 Business Purpose · 🏗️ Architecture & Data Flow · 🔗 Dependencies · 🌐 API Endpoints (backend/BFF) · 🎨 UI Components (frontend) · 🧪 Testing Guidelines. Update the AI.md **in the same commit** as the code change.

## Commit Cadence
- Commit code + per-feature `AI.md` together (rule #15). Never let the AI.md drift behind the code.
- Run `./scripts/check-all.sh` before each commit.

## Notes
- **Always run the BATCH check** (`./scripts/check-all.sh`), never individual checks in a fix loop (RULE #16).
- For delegated execution in Claude Code: hand each phase to the appropriate subagent (`@dapen-backend` for phases 1–3, `@dapen-frontend` for phases 4–5, `@dapen-qa` for phase 6).
- Reference: see the existing `tasks/TASK-008-user-permissions-full.md` for a fully-worked example that follows this workflow.
