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

### Error Map (4-field, untuk error non-validasi)

WAJIB untuk semua error response (selain validation 400 dari gin binding). Struktur `error_map` sesuai RULES.md §3:

```json
{
  "success": false,
  "status": 404,
  "message": "User not found",
  "error_map": {
    "code": "EID_NOT_FOUND",
    "error_name": "User Tidak Ditemukan",
    "reason": "User dengan ID \"SA\" tidak ditemukan pada tabel users.",
    "action": "Periksa kembali ID user, muat ulang daftar user, atau pilih user lain dari daftar."
  }
}
```

| Field | Bahasa | Catatan |
|---|---|---|
| `code` | English | UPPER_SNAKE_CASE, identifier unik |
| `error_name` | Indonesia | Judul singkat untuk UI |
| `reason` | Indonesia | Penjelasan mengapa error terjadi |
| `action` | Indonesia | Langkah konkret yang bisa dilakukan user |

Helper untuk emit error_map (lihat `internal/infrastructure/response/response.go`):
- `response.BadRequestWithMap(c, msg, SErrorMap{...})` → 400
- `response.UnauthorizedWithMap(c, msg, SErrorMap{...})` → 401
- `response.ForbiddenWithMap(c, msg, SErrorMap{...})` → 403
- `response.NotFoundWithMap(c, msg, SErrorMap{...})` → 404
- `response.ConflictWithMap(c, msg, SErrorMap{...})` → 409
- `response.InternalErrorWithMap(c, msg, SErrorMap{...})` → 500

**Jangan** pakai `response.NotFound(c, "EID_NOT_FOUND")` saja — itu hanya menulis
string ke `message`, tanpa 4-field `error_map` yang dibutuhkan frontend untuk
menampilkan reason + action.

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

## Identity Domain: User Model (CRITICAL — read before adding admin endpoints)

The project has **two distinct user identifiers** in the same database. Conflating them caused the TASK-017 bug ("Invalid user ID format" on session monitoring). Both must be handled explicitly.

| Field | Type | Source | Purpose |
|---|---|---|---|
| `SUser.ID` (PK) | `uint` auto-increment | `users` table | Internal numeric ID. **Only** ID safe to use as Redis key suffix, JWT `sub` claim, foreign key, URL `/:id` for **internal** APIs. |
| `SUser.UserID` | `string` | FK to `DBFLPASS.USERID` | Legacy login code (e.g. `"SA"`, `"ADMIN"`). **Only** identifier available in the admin UI (User Management screen). Maps to `DBFLPASS.USERID` which is the operator's login name. |
| `SUser.Email` | `string` | `users` table | Auth login identifier (since TASK-016 migration). |

### Identity Resolution Rule (MANDATORY for every new admin endpoint)

Any endpoint called from the admin UI where the URL path contains a user identifier **MUST** use the **legacy `user_id` string** as the public path parameter, then resolve internally to numeric `SUser.ID`. Do NOT call `strconv.ParseUint` on a legacy string — it will fail with `Invalid user ID format`.

**Pattern** (in identity/user repository):

```go
// GetIDByLegacyUserID resolves a DBFLPASS USERID string (e.g. "SA") to SUser.ID (uint).
// Returns 0 + gorm.ErrRecordNotFound if no mapping exists.
func (r *userRepository) GetIDByLegacyUserID(ctx context.Context, legacyUserID string) (uint, error) {
    var u SUser
    if err := r.db.WithContext(ctx).Select("id").Where("user_id = ?", legacyUserID).First(&u).Error; err != nil {
        return 0, err
    }
    return u.ID, nil
}
```

Add the method to the `IUserRepository` interface and inject the user repository into any feature service that needs to resolve legacy IDs (e.g. `features/session/service.go`).

**On user-not-found** return 404 via `response.NotFoundWithMap(...)` (or whichever helper in `internal/shared/response/` supports custom 4-field `error_map`) with `code: "EID_NOT_FOUND"`. The 4-field `error_map` is mandatory — see root CLAUDE.md §3.

**Exception**: Internal-only admin APIs that are never called with legacy strings (e.g. behind a panel that shows `SUser.ID` directly) may keep `strconv.ParseUint`. Document the exception in the handler's Swaggo comment.

### SUser Entity Quick Reference

| Column | Type | Notes |
|---|---|---|
| `id` | `uint` (PK) | Auto-increment. Used as Redis session key suffix. |
| `user_id` | `string` (FK→DBFLPASS.USERID) | Legacy login code. Indexed, size 100. |
| `email` | `string` | Login identifier. Unique. |
| `password` | `string` | Bcrypt hash. Never log. |
| `name`, `full_name` | `string` | Display. |
| `role` | `string` | `admin` / `karyawan` / `user`. |
| `is_active` | `bool` | Soft disable. |
| `dbflpass` | *DBFLPASS | GORM relation. |

---

## Session Storage Contract (Redis) — read before touching sessions

Two key formats, **both required** for session monitoring to work:

| Key | Type | Written by | Read by | Purpose |
|---|---|---|---|---|
| `bff:session:{sessionId}` | `string` (JSON) | `createSession()` in `frontend/src/server/session.ts` | `getSession()`, `getValidAccessToken()` | Session payload (userId numeric, accessToken, refreshToken, expiresAt, user object). |
| `bff:user_sessions:{userId}` | `set` (UUIDs) | `createSession()` SADD, `updateSession()` EXPIRE, `destroySession()` SREM | `session/repository.go` `GetUserSessions()` via `SMEMBERS` | Reverse index: which sessionIds belong to a user. |

**Why both?** The session ID is a random UUID (`crypto.randomUUID()`), so the backend can't query "all sessions for user N" without a reverse index. The SET is the index.

**TTL**: Both keys must use the same TTL (`SESSION_TTL_SECONDS` env, default 7 days). `createSession` and `updateSession` MUST `EXPIRE`/`SADD`-then-`EXPIRE` the user-sessions SET — otherwise it persists forever as a tombstone after a session is destroyed.

**Pitfalls** (all surfaced during TASK-017):
- `destroySession()` MUST call `getSession(sessionId)` first to read `userId` before SREM — the sessionId alone doesn't encode the user.
- `updateSession()` (called from the token-refresh path in `getValidAccessToken`) MUST refresh the EXPIRE on the user-sessions SET, not just the session key.
- Both keys must live in the **same** Redis DB. They are both written from `frontend/src/server/redis.ts`.

---

## Scope Discipline

**NEVER** modify files in `frontend/`. That directory is owned by `@dapen-frontend`.
