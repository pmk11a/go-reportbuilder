# DAPEN Master Architecture & Code Patterns

This document is the canonical *Source of Truth* for design patterns, coding rules, and architecture of the DAPEN project (Golang Backend & React Frontend). Read this before writing any code, whether you are an AI agent or a human developer. All documentation is written in English.

The architecture combines three patterns:

- **Domain-Based Architecture** (organize by business capability)
- **DDD-Lite** (Domain Driven Design Lite, without full DDD complexity)
- **Layered Structure per Domain** (handler → service → repository → entity within each domain)

The full rationale and rules live in `~/.claude/projects/.../memory/dapen-architecture.md` and `dapen-code-style.md`. This document is the project-local copy.

---

## 1. Backend Architecture (Domain-Based + DDD-Lite + Layered)

### 1.1 Folder layout (canonical)

```
backend/internal/
├── shared/                  # technical concerns only
│   ├── auth/                # JWT, auth middleware, role guards
│   ├── cache/               # Redis cache helpers
│   ├── config/              # config loading
│   ├── database/            # GORM, Redis, migrations, seeders
│   ├── logger/              # logging
│   ├── middleware/          # rate limit, timeout, security
│   ├── pagination/          # pagination helpers
│   ├── response/            # standard envelope
│   ├── validator/           # input validation
│   └── export/              # generic ExcelStreamWriter, PDFTableWriter
│
├── <domain>/                # one business domain (e.g., identity, accounting)
│   └── <sub_domain>/        # one feature within the domain (e.g., user, permission)
│       ├── handler.go
│       ├── service.go
│       ├── repository.go
│       ├── entity.go        # GORM models
│       ├── dto.go           # request/response payloads
│       ├── routes.go        # registers HTTP routes for this sub-domain
│       └── *_test.go
```

### 1.2 Why Domain-Based

- **Organize by business capability**, not by file type. A `User` lives in one place (`identity/user/`), not split across `handlers/`, `services/`, `repositories/`, `models/`, `dto/`.
- **DDD-Lite** gives Domain Boundary, Ubiquitous Language, and Domain Ownership without full DDD ceremony.
- **Routes and DTOs live close to the domain** — `internal/identity/user/routes.go` registers the user routes; `internal/identity/user/dto.go` holds the user DTOs.
- **Shared only for technical concerns** (auth, db, response envelope, cache, middleware, etc.). No business helpers in `shared/`.

### 1.3 Dependency Rules (strict)

```
handler → service → repository → database
```

- **Handler MUST NOT call repository directly.** No business logic in handlers.
- **Repository MUST NOT call service or handler.** Pure data access.
- **Service may call repository.** May also call other domains' services (NOT their repositories).

### 1.4 Inter-Domain Communication

- **Allowed:** `orderService → userService` (call the owning domain's service).
- **Forbidden:** `orderService → userRepository` (reach into another domain's data layer).
- If a domain exposes public API to others, define a **facade** (a sub-set of service methods) that other domains can call.

### 1.5 Naming Conventions (strict)

- **Interfaces** start with `I`: `IUserRepository`, `IUserService`.
- **Structs** start with `S`: `SUser`, `SAuthHandler`, `SDbPerkiraan`.
- **GORM models** implement `TableName() string` to prevent automatic pluralization.
- **Files** are singular, named after the type/responsibility: `handler.go`, `service.go`, `repository.go`, `entity.go`, `dto.go`, `routes.go`.

### 1.6 Database Models

- Database models live in the **owning domain's `entity.go`**, not in a global `models/`.
- Example: `SDbFlmenu` (per-user menu permissions) lives in `internal/identity/permission/entity.go`, not `internal/models/`.
- Example: `SDbPerkiraan` (COA master) lives in `internal/accounting/perkiraan/entity.go`.

### 1.7 GORM and Migrations

- Migrations are NOT executed at app startup. Invoked via `go run cmd/main.go --migrate` (and `--seed` for data).
- **NEVER** use `AutoMigrate` on legacy Laravel tables (e.g., `DBCUSTSUPP`).
- Do not add `CreatedAt`/`UpdatedAt` columns to legacy tables.
- Always specify `size:100` on string indexes (MSSQL pitfall).

### 1.8 API Response Envelope

All JSON outputs go through the standard envelope:

```json
{ "success": true, "status": 200, "message": "OK", "data": { ... } }
```

Use the helpers from `internal/shared/response/` (formerly `utils.Success`, `utils.Error`, `utils.Created`, `utils.BadRequest`, `utils.Unauthorized`, `utils.Forbidden`, `utils.NotFound`, `utils.InternalError`). **Never** call `c.JSON(...)` directly in handlers.

### 1.9 Security

- **Auth:** JWT validation via `internal/shared/auth/` middleware.
- **Rate limiting:** Dual-layer Token Bucket (global + per-IP) via `internal/shared/middleware/`. Atomic Lua script in the BFF for multi-instance. Always emit `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. Fail-open if Redis is down.
- **Trusted proxies:** `engine.SetTrustedProxies(nil)` to silence proxy-IP warnings.
- **Caching:** Redis-backed cache with keys `cache:global:[feature]:[endpoint]` and `cache:user:[userId]:[feature]:[endpoint]`. Invalidate on every mutation. Fail-open if Redis is down.

### 1.10 Testing

- `services/`, `handlers/`, `middlewares/` MUST have unit tests (`_test.go` adjacent to source).
- Use `testify` + `DATA-DOG/go-sqlmock` (or `mockery`-generated mocks).
- Aim for ≥80% coverage on tested packages (enforced by `scripts/check-all.sh`).
- GORM database query testing is at the integration test layer, not unit tests.

### 1.11 DAPEN Current Domain Map

| Domain | Sub-domains |
|---|---|
| `shared/` | auth, cache, config, database, logger, middleware, pagination, response, validator, export |
| `identity/` | user, permission, auth |
| `menu/` | (master menu catalogue: DBMENU, DBMENUREPORT) |
| `accounting/` | perkiraan, periode, jurnal (future) |
| `reports/` | permission_report |
| `filters/` | (shared filter widgets) |
| `dashboard/` | (dashboard stats) |
| `activity/` | (activity log) |

---

## 2. Frontend Architecture (Strict Separation of Concerns)

The React (Vite) frontend uses **TanStack Router**, **TanStack Query**, and **Zustand**. Strict Separation of Concerns (SoC) keeps UI, *Fetching*, *State*, and Data Types separate.

### 2.1 Folder Layout

```
frontend/src/
├── api-handlers/          # BFF route handlers (server-side, Vite plugin dispatch)
├── bff/                   # BFF infrastructure (dispatcher, session, redis, rate-limit, csrf)
├── components/            # Reusable UI components (atomic, Shadcn-style)
│   ├── ui/                # Atomic design primitives (button, dialog, table, ...)
│   └── admin/             # Admin-specific components (grouped by feature)
│       ├── menu/
│       ├── users/
│       ├── perkiraan/
│       └── reports/
├── hooks/                 # React + TanStack Query hooks
├── locales/               # i18n translations (en + id)
├── routes/                # TanStack Router files (file-based)
├── services/              # API integration layer
├── store/                 # Zustand global state
├── types/                 # Centralized TypeScript types
└── utils/                 # Shared utilities (errorMapper, etc.)
```

### 2.2 Strict Frontend Rules (CRITICAL)

1. **Centralized Data Types (Types)** — All `interfaces` and `types` MUST reside in `src/types/` (e.g., `components.ts`, `domain.ts`). Naming: `I` for Interfaces (`IUser`), `T` for Types (`TTheme`), `P` for Component Props (`PMenuFormDialog`). **`any` is FORBIDDEN.**
2. **No Fetching in Components** — `axios` / `fetch` is STRICTLY FORBIDDEN inside `components/`. All network I/O lives in `src/services/`, wrapped by TanStack Query Hooks (`src/hooks/`).
3. **Error Mapping Separation** — All errors are thrown to `src/utils/errorMapper.ts` (3-part: What, Why, Next Steps). Components MUST NOT format errors themselves.
4. **BFF (Backend for Frontend)** — `src/api-handlers/` controls APIs passing through server-side Vite plugin routes to secure JWT in HttpOnly Cookies. Must use `BffResponseBuilder`.
5. **Multi-Language (i18n)** — Hardcoding strings is forbidden. All UI text, placeholders, and validation errors must call `useTranslation()` (in `src/locales/en` and `id`). English is the default.

### 2.3 Theme, Styles & Components (NO Glassmorphism)

- **NO Glassmorphism.** Use only the Shadcn-style atomic components from `frontend/src/components/ui/`. These are solid surfaces, not translucent.
- **Atomic Design & Reusability** — Before creating a new button/input, always check `/components/ui/` first.
- **Loading & Skeleton** — Use `<Skeleton />` components (for layouts) and a rotating `<Loader2 />` inside buttons during submits. Flat loading text is forbidden.
- **SEO & A11y** — Use `<Helmet>` from `react-helmet-async` for `title` & `meta`. `aria-label` on every icon-only element.
- **Semantic Color Theme** — Use `bg-primary`, `text-secondary-600`, etc. No raw HEX in JSX.

### 2.4 Data Rendering

- Use `<Each />` and `<Show />` from `frontend/src/components/ui/layout/Render.tsx` for lists and conditionals.
- **No** raw `.map()`, `&&`, or `? :` ternaries in the primary TSX return block.

### 2.5 Role-Based Navigation

- Path prefixes: `/admin` and `/karyawan`.
- TanStack Router's `beforeLoad` enforces access rights (Guards).

---

## 3. Code Style (DAPEN-wide)

The author is actively learning Go. The code style is designed for self-documenting, tutorial-like code. See `dapen-code-style.md` memory for the full guide. Summary:

- **English-only** in all code, comments, and documentation. No Indonesian.
- **Variable names**: intention-revealing, NOT type labels. `menuPermissionsForUser` not `perms`.
- **Function names**: action + target. `fetchMenuPermissionsForUser` not `getData`.
- **Comments**: English, on every non-trivial block, explaining **WHY** (not WHAT).
- **Doc comments** on every exported function/hook/component.
- **Error wrapping**: `fmt.Errorf("context: %w", err)`.
- **Magic numbers → named constants** (use `time.Duration` for time).
- **TODO/FIXME** with date and author: `// TODO(2026-06-04 masza1): …`.

---

## 4. Automation & Quality Gates

**Mandatory Tests** (full quality gate, run after every change):

- **Backend Unit Tests**: services/, handlers/, middlewares/. `testify` + `mockery`.
- **Backend E2E Tests**: `backend/tests/e2e/`. `httptest` against full router.
- **Frontend Unit Tests**: hooks/ and services/ logic. Vitest.
- **E2E**: Core workflows (Login) via Playwright.

**API Documentation**:
- Every handler MUST have Swaggo/Swagger annotations.
- `swag init` is mandatory after route changes; regenerates `backend/docs/`.

**Quality Gate**:
- `./scripts/check-all.sh` is the single source of truth (RULE #16).
- Batch-collect all errors before any fix-loop.

---

## 5. When to Trigger a Refactor

If the project grows and any of these become true, consider a refactor:

- A single `internal/<layer>/` folder has > 15 files.
- Difficulty finding "where does X live".
- Adding a new entity feels like a chore.

The current Domain-Based structure scales well until ~30+ entities per domain. Sub-domain splitting follows the Domain Growth Strategy in `dapen-architecture.md`.
