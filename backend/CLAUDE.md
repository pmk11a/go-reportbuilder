# CLAUDE.md — Backend (Go, Gin, GORM, SQL Server)

> See root `CLAUDE.md` for global rules. This file contains backend-specific details.
>
> Primary agent for this workspace: **`@dapen-backend`**

---

## Architecture: Domain-Based + DDD-Lite + Layered

Code is organized by **business domain**, NOT by file type.

### Folder Layout (canonical)

```
backend/internal/
├── shared/                  # Technical concerns only
│   ├── auth/                # JWT, auth middleware, role guards
│   ├── cache/               # Redis cache helpers
│   ├── config/              # Config loading (.env)
│   ├── database/            # GORM, Redis, migrations, seeders
│   ├── logger/              # Logging
│   ├── middleware/          # Rate limit, timeout, security
│   ├── pagination/          # Pagination helpers
│   ├── response/            # Standard envelope helpers
│   ├── validator/           # Input validation
│   └── export/              # ExcelStreamWriter + PDFTableWriter
│
├── <domain>/                # Business domain (e.g., identity, accounting)
│   └── <sub_domain>/        # One feature within domain (e.g., user, permission)
│       ├── handler.go
│       ├── service.go
│       ├── repository.go
│       ├── entity.go        # GORM models (SUser, SDbMenu...)
│       ├── dto.go           # Request/response payloads
│       ├── routes.go        # Registers HTTP routes for this sub-domain
│       └── *_test.go
└── ...
```

### Current Domain Map

| Domain | Sub-domains |
|---|---|
| `shared/` | auth, cache, config, database, logger, middleware, pagination, response, validator, export |
| `identity/` | user, permission, auth |
| `menu/` | master menu catalogue (DBMENU, DBMENUREPORT) |
| `accounting/` | perkiraan, periode, jurnal (future) |
| `reports/` | permission_report |
| `filters/` | shared filter widgets |
| `dashboard/` | dashboard stats |
| `activity/` | activity log |

> **Migration note**: Legacy code still exists in `internal/legacy/` (old handlers/services/repositories). Target architecture above. Migration ongoing via per-domain sprints.

---

## Dependency Rules (strict)

```
handler → service → repository → database
```

- **Handler MUST NOT call repository directly.** No business logic in handlers.
- **Repository MUST NOT call service or handler.** Pure data access.
- **Inter-domain:** `orderService → userService` ✅ | `orderService → userRepository` ❌

---

## Mandatory Checklist

- [ ] Code lives in `internal/<domain>/<sub_domain>/` — NOT in global `handlers/`, `services/`, etc.
- [ ] `entity.go` contains GORM models; `dto.go` contains JSON structs; `routes.go` registers routes.
- [ ] Layered: handler → service → repository (no layer skipping).
- [ ] DI via interfaces: service depends on repository interface, not concrete struct.
- [ ] Struct names start with `S` (e.g., `SUser`). Interface names start with `I` (e.g., `IUserRepository`).
- [ ] GORM models implement `TableName() string`.
- [ ] Inter-domain access only via the owning domain's service.
- [ ] All protected routes use `internal/shared/auth/` middleware.
- [ ] All responses via `internal/shared/response/` helpers — never `c.JSON(...)` directly.
- [ ] Every endpoint has Swaggo/Swagger annotations; `swag init` run after route changes.
- [ ] Unit tests (`_test.go`) adjacent to source files using `testify` + `DATA-DOG/go-sqlmock`.
- [ ] E2E tests in `backend/tests/e2e/` using `httptest`.

---

## API Response Envelope

```json
{ "success": true, "status": 200, "message": "Message", "data": { ... } }
```

Helper mappings:
- `response.Success(c, "msg", data)` → 200
- `response.Created(c, "msg", data)` → 201
- `response.BadRequest(c, "msg")` → 400
- `response.Unauthorized(c, "msg")` → 401
- `response.Forbidden(c, "msg")` → 403
- `response.NotFound(c, "msg")` → 404
- `response.InternalError(c, "msg")` → 500

---

## Naming Conventions

```go
// Interfaces: I prefix
type IUserRepository interface { ... }
type IUserService interface { ... }

// Structs: S prefix
type SUser struct { ... }
type SAuthHandler struct { ... }

// Variables: intention-revealing
var menuPermissionsForUser []SUserPermission   // ✅
var perms []SUserPermission                     // ❌

// Functions: action + target
func fetchMenuPermissionsForUser(ctx, userID) {}  // ✅
func getData() {}                                  // ❌

// Error wrapping
return fmt.Errorf("fetching permissions for user %q: %w", userID, err)
```

---

## GORM Rules

- **NEVER** use `AutoMigrate` on legacy tables. Use `--migrate` CLI flag.
- Do NOT add `CreatedAt`/`UpdatedAt` to legacy tables.
- Specify `size:100` on string indexes (MSSQL pitfall).
- Parameter placeholders use SQL Server style: `@p1`, `@p2`.

---

## Security

- JWT validation via `internal/shared/auth/` middleware.
- Rate limiting: Redis-backed Token Bucket (global + per-IP). Atomic Lua script. Emit `X-RateLimit-*` headers. Fail-open if Redis is down.
- `engine.SetTrustedProxies(nil)` to silence proxy-IP warnings.

---

## Testing

- Unit tests: `testify` + `DATA-DOG/go-sqlmock` (or `mockery`). ≥80% coverage on tested packages.
- E2E tests: `httptest` against full router in `backend/tests/e2e/`. No DB mocks.
- Adjacent placement: `user_handler_test.go` next to `handler.go`.

---

## Quick Commands

```bash
go run cmd/main.go              # Start server
go run cmd/main.go --migrate    # Apply DB migrations
go run cmd/main.go --seed       # Seed initial data
go test ./... -v                # Run all tests
./scripts/check-all.sh --backend-only   # Quality gate
swag init                       # Regenerate Swagger docs
```

---

## Identity Domain: User Permission Management

### Database Schema

Three legacy SQL Server tables:
- `dbflmenu` (per-user) LEFT JOIN `DBMENU` (master) on `L1 = KODEMENU`
- `DBFLMENUREPORT` (per-user) LEFT JOIN `DBMENUREPORT` (master) on `L1 = KODEMENU`
- `DBAKSESPERKIRAAN` — per-user COA access

### Granular Permission Fields

- **Legacy**: `checked`, `aktif`, `ACCESS`
- **Granular**: `HASACCESS`, `ISTAMBAH`, `ISKOREKSI`, `ISHAPUS`, `ISCETAK`, `ISEXPORT`, `IsOtorisasi1-5`, `IsBatal`

### API Endpoints

```
GET  /api/admin/users/{id}/permissions
PUT  /api/admin/users/{id}/permissions
GET  /api/admin/users/{id}/permissions/menu
GET  /api/admin/users/{id}/permissions/report
GET  /api/admin/users/{id}/permissions/coa
GET  /api/admin/reports/permissions?format=json|xlsx|pdf
```

### Notes

- All permission updates are transactional (atomic) across all three tables.
- Excel writer uses `excelize.StreamWriter` with `Flush()` every 1000 rows.
- PDF writer uses `go-pdf/fpdf` landscape A4 with repeating headers.
- Excel/PDF exports require at least one filter (`userId` or `menuId`) to prevent OOM.

---

## Scope Discipline

**NEVER** modify files in `frontend/`. That directory is owned by `@dapen-frontend`.
