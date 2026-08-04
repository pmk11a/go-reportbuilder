# TASK-026: DBTRANSAKSI Missing Column Fallback (XSusut / PerlakuanAktiva)

## Status
⏳ **IN_PROGRESS** - July 24, 2026

## Summary

Production `DBTRANSAKSI` table contains `XSusut` and `PerlakuanAktiva` columns (legacy Delphi schema). Dev DB does NOT have these columns. The Go model `SDBTRANSAKSI` declares both with GORM tags, so `tx.Create(row)` emits an INSERT that includes them — SQL Server rejects it with `Invalid column name 'PerlakuanAktiva'`.

A unit test fixture (`service_test.go:1077`) anticipates this exact error and tests a `extractMissingColumn()` helper that does not yet exist in production code.

## Goal

Implement **approach (1) — raw-SQL fallback** so the same code works on both prod (columns present) and dev (columns absent) without schema drift and without changing the model.

## Symptom (user-reported)

> re-inserting detail row 1: mssql: Invalid column name 'PerlakuanAktiva'.

## Root Cause

- `backend/internal/infrastructure/persistence/models/dbtransaksi.go:41,47` — model has:
  ```go
  XSusut          int `gorm:"column:XSusut"           json:"xsusut"`
  PerlakuanAktiva int `gorm:"column:PerlakuanAktiva"  json:"perlakuanaktiva"`
  ```
- `backend/internal/features/accounting/kasbank/service.go:1024-1025` populates them on the row before `tx.Create(row)` at `service.go:629` (also `service.go:478`).
- Dev SQL Server `DBTRANSAKSI` lacks those columns → INSERT fails.
- Prod SQL Server `DBTRANSAKSI` has them → works fine.

## Affected Files

| File | Change |
|---|---|
| `backend/internal/infrastructure/persistence/models/dbtransaksi.go` | NO change — keep GORM tags as-is. |
| `backend/internal/features/accounting/kasbank/service.go` | Add `safeCreate()` helper that probes column existence once per tx, falls back to raw `INSERT` excluding missing columns. Apply to all `tx.Create(&SDbTransaksi{...})` call sites for DBTRANSAKSI (lines ~478 and ~629). |
| `backend/internal/features/accounting/kasbank/service.go` | Implement `extractMissingColumn(err) (string, bool)` — parses mssql "Invalid column name 'X'" errors. Helper already tested but missing. |
| `backend/internal/features/accounting/kasbank/service_test.go` | Verify orphan `TestExtractMissingColumn` still compiles (it currently does not — function does not exist). |

## Implementation Plan

### Step 1 — Implement `extractMissingColumn`
```go
// extractMissingColumn pulls the offending column name out of an mssql
// "Invalid column name 'X'" error. Returns ("", false) for unrelated errors.
// Handles: single quotes, double quotes, brackets, backticks, and multiple
// "Invalid column name" lines concatenated by \n.
func extractMissingColumn(err error) (string, bool) {
    if err == nil {
        return "", false
    }
    msg := err.Error()
    re := regexp.MustCompile(`(?i)Invalid column name [`'"\[]+([^'"\]\s]+)[`'"\]]+`)
    m := re.FindStringSubmatch(msg)
    if m == nil {
        return "", false
    }
    return m[1], true
}
```

### Step 2 — `safeCreateDBTransaksi` helper
Probes `INFORMATION_SCHEMA.COLUMNS` once per transaction (cached) to know which optional columns the target DB actually has:
```go
// optionalCols lists columns on DBTRANSAKSI that may exist in prod but not dev.
// Probed via INFORMATION_SCHEMA.COLUMNS at runtime.
var optionalCols = []string{"XSusut", "PerlakuanAktiva"}

func (s *SKasBankService) safeCreateDBTransaksi(ctx context.Context, tx *gorm.DB, row *SDbTransaksi) error {
    // 1. Build the column list dynamically based on what the target DB has.
    existing, err := probeOptionalColumns(ctx, tx, "DBTRANSAKSI", optionalCols)
    if err != nil {
        return err
    }
    // 2. If both columns exist, defer to GORM's normal Create (zero overhead).
    if len(existing) == len(optionalCols) {
        return tx.Create(row).Error
    }
    // 3. Otherwise build a raw INSERT with only the columns the DB has.
    return rawInsertDBTransaksi(tx, row, existing)
}
```

`probeOptionalColumns` runs `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DBTRANSAKSI' AND COLUMN_NAME IN ('XSusut','PerlakuanAktiva')` once per transaction (store result in `tx` session map to avoid re-querying per row).

`rawInsertDBTransaksi` builds `INSERT INTO DBTRANSAKSI (col1, col2, ...) VALUES (?, ?, ...)` excluding `XSusut`/`PerlakuanAktiva` if absent, manually supplying values for the remaining ~30 columns. Use the same `gorm.Model` column set as GORM would for the model (no GORM auto-WHERE, no soft-delete; raw `VALUES` only).

### Step 3 — Replace call sites
- `service.go:478` → `s.safeCreateDBTransaksi(ctx, tx, row)` (CreateHeader)
- `service.go:629` → `s.safeCreateDBTransaksi(ctx, tx, row)` (UpdateHeader re-insert)

DO NOT replace `tx.Create(&aktiva)` (line 523, 675), `tx.Create(&g)` (498, 648), `tx.Create(&d)` (503, 653), `tx.Create(&hp)` (511, 665), or `tx.Save(existing)` (591) — those target other tables not affected by this issue.

### Step 4 — Tests
- Verify `TestExtractMissingColumn` (already present) now compiles and passes.
- Add new test `TestSafeCreateDBTransaksi_AllColsPresent` — mocks INFORMATION_SCHEMA returning both columns; expects `tx.Create(row)` to be called (or no error).
- Add new test `TestSafeCreateDBTransaksi_MissingPerlakuanAktiva` — mocks only `XSusut` present; expects raw INSERT without `PerlakuanAktiva` column.
- Add new test `TestSafeCreateDBTransaksi_MissingBoth` — mocks neither column present; expects raw INSERT without either.

### Step 5 — Frontend
No changes. `perlakuanAktiva` and `xSusut` remain valid in the request DTO. If neither dev nor prod persists them, the FE just sends them harmlessly (server ignores the values when columns are absent).

## Acceptance Criteria

- [ ] `extractMissingColumn` implemented and `TestExtractMissingColumn` passes (file: `service_test.go:1058-1093`).
- [ ] `safeCreateDBTransaksi` helper implemented; both `CreateHeader` and `UpdateHeader` use it.
- [ ] `tx.Create(&SDbTransaksi{...})` no longer called directly — replaced by safe variant.
- [ ] New tests `TestSafeCreateDBTransaksi_*` added with ≥3 cases (all cols, missing one, missing both).
- [ ] On dev DB (no XSusut, no PerlakuanAktiva): `re-inserting detail row 1` error gone — POST `/api/accounting/kasbank` succeeds for aktiva-tagged transactions.
- [ ] On prod DB (both cols present): no behavior change — original `tx.Create(row)` path taken.
- [ ] No model change (`dbtransaksi.go` untouched).
- [ ] No frontend change.

## Out of Scope

- ❌ Do NOT add ALTER TABLE migrations (forbidden per `CLAUDE.md` "Database Migrations" — no AutoMigrate).
- ❌ Do NOT change model field tags.
- ❌ Do NOT touch other tables (DBHUTPIUT, DBGIRO, DBDEPOSITO, DBAKTIVA).

## Manual Verification (USER runs, agent does not)

```bash
go build ./...                        # verify compilation
go test ./internal/features/accounting/kasbank/... -v -run "TestExtractMissingColumn|TestSafeCreateDBTransaksi"
go test ./... -v                      # full unit suite
./scripts/check-all.sh --backend-only # quality gate
```

Then manual smoke test against dev:
1. Login as `superadmin`.
2. Open KasBank form → Aktiva sub-form → fill all fields.
3. Click Save → expect 200, no `Invalid column name 'PerlakuanAktiva'`.
4. Re-open saved voucher → expect fields persist (XSusut/PerlakuanAktiva round-trip only if dev DB has cols; otherwise just zeros, which is expected).

## Related Lessons

- `CLAUDE.md` §"Lessons Learned — Invalid Column Name (DBHUTPIUT Outstanding)" — same root cause (model column ≠ DB column), different fix (rename SQL ref). This task takes a different approach (runtime column probe) because both columns are LEGITIMATE in prod.
- `CLAUDE.md` §"Lessons Learned — Aktiva Sub-Form Delphi Parity" — context for why XSusut/PerlakuanAktiva exist on `SDBAKTIVA` intent vs `SDBTRANSAKSI` reality.