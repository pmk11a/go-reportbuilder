# AI.md - Backend Quick Reference

> **Global Rules**: Always refer to `../.gemini/ARCHITECTURE.md` for major architectural patterns and `~/.claude/projects/.../memory/dapen-architecture.md` for the Domain-Based + DDD-Lite guide. Code style is in `dapen-code-style.md` (declarative names + English comments).
>
> **All language in code, comments, and documentation MUST be English.**

## 🎯 Backend Focus (Golang, Gin, Domain-Based + DDD-Lite)

The `backend/` workspace controls SQL Server database queries via GORM, business logic, JWT security, and standard REST APIs. The architecture is **Domain-Based + DDD-Lite + Layered within each domain** (NOT a global `handlers/services/repositories/` split).

Primary work in this area is always assigned to: **`@dapen-backend`**

### 📋 Mandatory Backend Checklist

- [ ] **Domain-Based architecture** is enforced: code lives in `internal/<domain>/<sub_domain>/`, NOT in global `handlers/`, `services/`, `repositories/`, `dto/`, `models/` folders.
- [ ] **Database Table Models** live in the owning domain's `entity.go`. JSON DTOs live in the owning domain's `dto.go`. Routes live in the owning domain's `routes.go`.
- [ ] **Layered within each domain**: `handler.go` → `service.go` → `repository.go` → `entity.go`. Handler MUST NOT call repository directly.
- [ ] **Dependency Injection** via Interfaces (starting with `I`). Service depends on Repository interface, not concrete.
- [ ] **Struct naming** starts with `S` (e.g., `SUser`). **Interface** naming starts with `I` (e.g., `IUserRepository`).
- [ ] **Inter-domain access** goes through the owning domain's service, NEVER through another domain's repository.
- [ ] All protected routes are secured using `internal/infrastructure/auth/` middleware.
- [ ] All API responses MUST use helpers from `internal/infrastructure/response/` (e.g., `response.Success(c, "msg", data)`, `response.Error(c, status, "msg")`, `response.BadRequest(c, "msg")`, `response.InternalError(c, "msg")`). Direct calls to `c.JSON` are strictly forbidden.
- [ ] **API Documentation**: EVERY endpoint (existing or new) MUST have Swagger annotations (Swaggo) above its handler function, and `swag init` must be run.
- [ ] `Unit Tests` are written adjacent to source files (`_test.go`) using Mocking (testify + `DATA-DOG/go-sqlmock`).
- [ ] `E2E Tests` are written in `backend/tests/e2e/` using `httptest` to test the full router layer without mocking.
- [ ] **Code style** per `dapen-code-style.md`: declarative names, English comments per logic block, error wrapping with context.

### 📝 REST API Response Rules

All REST API handler responses must use the centralized helpers from `internal/infrastructure/response/`.

**Standard Response Structure:**
```json
{
  "success": true,
  "status": 200,
  "message": "Message description",
  "data": { ... }
}
```

**Common Helper Mappings:**
- **Success 200 OK**: `response.Success(c, "Success message", data)`
- **Created 201 Created**: `response.Created(c, "Created message", data)`
- **Bad Request 400**: `response.BadRequest(c, "Validation error message")`
- **Unauthorized 401**: `response.Unauthorized(c, "Authentication token invalid/expired")`
- **Forbidden 403**: `response.Forbidden(c, "Role lacks required access level")`
- **Not Found 404**: `response.NotFound(c, "Record not found")`
- **Internal Error 500**: `response.InternalError(c, "Database/Server error message")`

## 📂 Main Backend Structure (Target)

```
backend/
├── cmd/
│   └── main.go                   # Entry point & Initializer
├── internal/
│   ├── shared/                   # Technical concerns only
│   │   ├── auth/                 # JWT, AuthMiddleware, RoleMiddleware
│   │   ├── cache/                # Redis cache helpers
│   │   ├── config/               # .env loader
│   │   ├── database/             # GORM, Redis, migrations, seeders
│   │   ├── logger/               # logging
│   │   ├── middleware/           # rate limit, timeout, security
│   │   ├── pagination/           # pagination helpers
│   │   ├── response/             # standard envelope helpers
│   │   ├── validator/            # input validation
│   │   └── export/               # generic ExcelStreamWriter + PDFTableWriter
│   ├── identity/                 # user, role, permission domain
│   │   ├── user/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   ├── repository.go
│   │   │   ├── entity.go         # SUser, SDBFLPASS
│   │   │   ├── dto.go
│   │   │   ├── routes.go
│   │   │   └── *_test.go
│   │   ├── permission/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   ├── repository.go
│   │   │   ├── export.go
│   │   │   ├── entity.go
│   │   │   ├── dto.go
│   │   │   ├── routes.go
│   │   │   └── *_test.go
│   │   └── auth/
│   │       ├── handler.go
│   │       ├── service.go
│   │       ├── repository.go
│   │       ├── entity.go
│   │       ├── dto.go
│   │       ├── routes.go
│   │       └── *_test.go
│   ├── menu/
│   │   ├── handler.go
│   │   ├── service.go
│   │   ├── repository.go
│   │   ├── entity.go            # SDbMenu, SDBMENUREPORT
│   │   ├── dto.go
│   │   ├── routes.go
│   │   └── *_test.go
│   ├── accounting/
│   │   ├── perkiraan/            # TASK-010 — COA master
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   ├── repository.go
│   │   │   ├── entity.go         # SPerkiraan, SDBAKSESPERKIRAAN
│   │   │   ├── dto.go
│   │   │   ├── routes.go
│   │   │   └── *_test.go
│   │   ├── periode/
│   │   └── jurnal/               # future
│   ├── reports/
│   │   └── permission_report/
│   ├── filters/
│   ├── dashboard/
│   └── activity/
└── tests/
    └── e2e/                      # full router tests via httptest
```

> **Migration note**: The current codebase still uses the legacy `internal/{handlers,services,repositories,models,dto}/` structure. The architecture above is the TARGET. Migration is in progress via per-domain sprints.

## ⚡ Quick Commands

Run the backend server normally:
```bash
go run cmd/main.go
```

Run Database Migration:
```bash
go run cmd/main.go --migrate
```

Run Initial Data Seeder:
```bash
go run cmd/main.go --seed
```

Run Unit Tests across all files:
```bash
go test ./... -v
```

Run Quality Gate (recommended before/after changes):
```bash
./scripts/check-all.sh --backend-only
```

## 🔐 Identity Domain: User Permission Management

### Domain Location (target)

`internal/features/identity/permission/` — handler, service, repository, export, entity, dto, routes, tests.

### Database Schema

Permission data persists in three legacy SQL Server tables (read via JOIN, never directly):
- `dbflmenu` (per-user) LEFT JOIN `DBMENU` (master) on `L1 = KODEMENU` — user menu permissions
- `DBFLMENUREPORT` (per-user) LEFT JOIN `DBMENUREPORT` (master) on `L1 = KODEMENU` — user report permissions
- `DBAKSESPERKIRAAN` — per-user COA access

### Granular Permission Fields

Each permission record supports legacy and granular models:
- **Legacy** (backward compatible): `checked`, `aktif`, `ACCESS`
- **Granular** (new): `HASACCESS`, `ISTAMBAH` (create), `ISKOREKSI` (update), `ISHAPUS` (delete), `ISCETAK` (print), `ISEXPORT`, `IsOtorisasi1-5` (approvals), `IsBatal` (cancel)

### API Endpoints

```
GET  /api/admin/users/{id}/permissions        → Combined (legacy)
PUT  /api/admin/users/{id}/permissions        → Updates all permission types atomically
GET  /api/admin/users/{id}/permissions/menu   → Menu only (per-tab cache)
GET  /api/admin/users/{id}/permissions/report → Report only (per-tab cache)
GET  /api/admin/users/{id}/permissions/coa    → COA only (per-tab cache)
GET  /api/admin/reports/permissions          → Permission Report matrix
   ?format=json                                → paginated JSON
   ?format=xlsx                                → streaming .xlsx (requires userId or menuId filter)
   ?format=pdf                                 → paginated landscape PDF (requires userId or menuId filter)
```

### Implementation Notes

- All updates are transactional (atomic) across menu, report, COA tables
- Granular fields store as INT (0/1) matching SQL Server schema
- GORM column mapping uses legacy SQL column names: `HASACCESS`, `ISTAMBAH`, etc.
- Parameter placeholders use SQL Server style: `@p1`, `@p2`
- Mock tests must match exact parameter count and table name case sensitivity
- The Excel writer uses `excelize.StreamWriter` with `Flush()` every 1000 rows for bounded memory
- The PDF writer uses `go-pdf/fpdf` with landscape A4, repeating header, manual page breaks
- Excel/PDF exports require at least one filter (`userId` or `menuId`) to prevent OOM
