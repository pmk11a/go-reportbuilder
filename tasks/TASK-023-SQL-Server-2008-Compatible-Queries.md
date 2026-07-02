<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-023-SQL-Server-2008-Backward-Compatible-Queries

## Business Problem

Production database runs on SQL Server 2008 R2. Current code uses `OFFSET ... FETCH NEXT` (SQL Server 2012+) and `sp_MSForEachTable` (undocumented). These will crash in production. We must make all queries backward-compatible with SQL Server 2008.

## Priority: Critical

## Status
✅ **COMPLETED** - June 26, 2026

## Acceptance Criteria
- [x] All `OFFSET ... FETCH NEXT` pagination replaced with `ROW_NUMBER()` pattern
- [x] `sp_MSForEachTable` removed from test helpers, replaced with explicit table list
- [x] All raw SQL queries verified compatible with SQL Server 2008
- [x] GORM model struct tags comply with SQL Server 2008 limitations (no unsupported types)
- [x] Seeder queries compatible with SQL Server 2008
- [x] Code compiles with zero errors
- [x] ADR-001 documented in `docs/adr/`

## User Stories
**As a backend developer**
I want all SQL queries to be compatible with SQL Server 2008
So that deployment to production doesn't crash with unknown T-SQL errors

**As a QA engineer**
I want test helpers to work without undocumented system procedures
So that CI/CD is reliable and doesn't depend on undocumented internals

## Implementation Plan

### Step 1: Pagination in `permission/repository.go` — `GetPermissionReportMatrix`
**File**: `backend/internal/features/identity/permission/repository.go` lines 241-248

Current:
```go
limitClause = " ORDER BY " + userIDCol + " ASC, " + menuCodeCol + " ASC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY"
```

Replace with `ROW_NUMBER()` wrapper:
```go
// Wrap the base query in a CTE or subquery with ROW_NUMBER()
baseQuery := `SELECT USERID, FullName, TINGKAT, KODEMENU, Keterangan, HasAccess, ...
              FROM (...) AS sub WHERE RN BETWEEN @start AND @end`
```

Approach: Create a helper function `paginateQuery(baseSQL string, orderBy string, page, pageSize int) (string, []interface{})` in `backend/internal/shared/pagination/` that returns `ROW_NUMBER()` wrapped SQL + args.

### Step 2: Pagination in `dashboard/handler.go` — `GetPensiunanWithoutFiles`
**File**: `backend/internal/features/dashboard/handler.go` lines 250-261

Same `OFFSET ... FETCH NEXT` → replace with `ROW_NUMBER()` pattern.

### Step 3: Replace `sp_MSForEachTable` in test helpers
**File**: `backend/tests/testhelper/db.go` lines 202 and 229

Remove:
```go
db.Exec("EXEC sp_MSForEachTable 'ALTER TABLE ? NOCHECK CONSTRAINT all'")
db.Exec("EXEC sp_MSForEachTable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'")
```

Replace with per-table constraint disable using `sys.foreign_keys` loop or just skip FK re-enable since `CleanupTestDB` already uses `DELETE FROM` (no FK issues there). The `TruncateAllTables` only runs once at suite teardown — use explicit table list with `DISABLE TRIGGER` / `ENABLE TRIGGER` if needed, or rely on `DELETE FROM` pattern (simpler, safer).

### Step 4: Create shared pagination helper
**New file**: `backend/internal/shared/pagination/paginator.go`

```go
package pagination

// MSSQL2008Paginator wraps a SQL query with ROW_NUMBER() pagination.
// Compatible with SQL Server 2008+ (no OFFSET/FETCH).
func MSSQL2008Paginator(baseSQL string, orderBy string, page, pageSize int) (string, []interface{})
```

Returns: `SELECT * FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY ...) AS rn FROM (...)) AS x WHERE rn BETWEEN @start AND @end`

### Step 5: Verify all other raw SQL queries
Check these locations to confirm 2008 compatibility:
- `backend/internal/features/accounting/kasbank/` — `WITH (UPDLOCK, HOLDLOCK)` ✅ (2008+)
- `backend/internal/features/identity/user/repository.go` — `sys.tables`, `INFORMATION_SCHEMA` ✅
- `backend/internal/infrastructure/middleware/permission.go` — `CASE WHEN` ✅
- Migrations: `sys.default_constraints`, `sys.foreign_keys` ✅

No changes needed for these.

## Testing Approach
- Run `go test ./...` — all existing tests must pass
- Verify pagination queries with large datasets (page > 1)
- Verify test `TruncateAllTables` works without `sp_MSForEachTable`
- Manual SQL execution against a SQL Server 2008 R2 instance if available

## Estimate
**Hours**: 4

## Dependencies
- None — pure code changes, no infrastructure dependencies

## Risks & Mitigations
- **ROW_NUMBER() wrapping changes query semantics**: Test page 1 and page > 1 separately
- **Order preservation**: Ensure `ORDER BY` in `ROW_NUMBER()` matches original query intent

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Tests passing (backend compiles, tests pass)
- [ ] Code reviewed
- [ ] ADR-001 in docs/adr/
- [ ] No use of SQL Server 2012+ features anywhere in the codebase
