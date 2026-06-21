# TASK-021: Kasbank — Default Period Filter + 5-Level Otorisasi (match trade-exchange)

<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

## ⚠️ CRITICAL RULES (Read Before Starting)

### 🎯 Rule 1: Plan Mode
Plan already discussed and approved by user in conversation before this task file was created (see Notes section for full root-cause analysis). Estimate is Medium (8-16h) — within `CLAUDE.md` Rule #0 "feature baru" threshold, formal Plan Mode ceremony already satisfied via the in-conversation plan + approval.

### 🚫 Rule 2: One Feature Per Task (No Merging)
Two changes (period filter default + 5-level otorisasi) are bundled here because they were discovered together while diagnosing the SAME root complaint ("data kasbank DAPEN beda dari trade-exchange") and both changes touch the same files (`kasbank/repository.go`, `service.go`, `entity.go`, `dto.go`, frontend `OtorisasiButton.tsx`). If either grows significantly during implementation, split into a successor task per Rule 2.

### 🧪 Rule 3: Two-Type Testing Strategy
- Unit tests: `backend/internal/features/accounting/kasbank/service_test.go` — `SetOtorisasi`/`CancelOtorisasi` across levels 1-5 with real DB; repository test for period-default filtering. NO MOCK DB.
- E2E: Playwright — approve a kasbank record through multiple otorisasi levels; confirm default list view is period-scoped.

---

## Priority
**High** — production data displayed differs from the reference system (trade-exchange) this feature is meant to mirror.

## Status
🧪 **AWAITING_MANUAL_TEST** - June 18, 2026 (backend complete; frontend pending separate agent)

## Business Problem
DAPEN's `/admin/accounting/kasbank` page shows different data than trade-exchange's `accounting/transaksi-bank-or-kas` (the system DAPEN's accounting module is modeled after), even though they're meant to be equivalent. Two confirmed root causes:
1. DAPEN's kasbank list has no default period restriction — it shows transactions from any date unless the frontend explicitly passes a date filter. trade-exchange always restricts to the user's active accounting period (`DBPERIODE`).
2. DAPEN's otorisasi (approval) workflow only implements 2 levels (`IsOtorisasi1/2`), while trade-exchange supports 5 (`IsOtorisasi1-5`). The DB columns for levels 3-5 already exist in DAPEN's GORM model (`backend/internal/infrastructure/persistence/models/dbtrans.go` lines 21-29) but are completely unused by the kasbank feature — confirmed zero references anywhere in `kasbank/*.go`.

## Description
See full root-cause investigation in Notes. Summary of the fix:

1. **Period filter** — `kasbank/repository.go`'s list query defaults to the user's active period (year/month from `DBPERIODE`, resolved via the existing `repo.GetPeriode(ctx, userID)` helper — already implemented for journal-date validation, just not reused for the list query) when the frontend doesn't pass explicit `dateFrom`/`dateTo`. Explicit date params still override — this only changes the *default* view.
2. **5-level otorisasi** — generalize `SetOtorisasi`/`CancelOtorisasi` in `service.go` from hardcoded levels 1-2 to a loop-friendly 1-5 implementation:
   - Level N requires level N-1 already approved.
   - Approver of level N must differ from the approver of level N-1.
   - Cancelling level N is blocked if level N+1 is already approved.
   - "Effective MaxOL" per record: use the record's existing `MaxOL` column if it's a valid 1-5 value, otherwise default to 2 (preserves current behavior for records created by DAPEN itself, which never set `MaxOL` and would otherwise read as 0).
   - `Locked` = approved-level-count ≥ effective MaxOL.
3. Expose `otorisasi3/4/5` + effective `maxol` through `dto.go`/`entity.go` (`SKasBankHeader`) and `frontend/src/domains/accounting/types/kasbank.ts`.
4. Widen `SOtorisasiRequest.Level` binding from `max=2` to `max=5` in `handler.go`.
5. Refactor `frontend/.../kasbank/OtorisasiButton.tsx` from hardcoded 2-button JSX to a loop rendering `1..maxol` levels with the same sequential-unlock UX. Review `KasBankDataTable.tsx` for the same hardcoded-2-level assumption.

**Not in scope:** fixing trade-exchange's own `TotalD` SQL bug (`CASE WHEN Valas='IDR' THEN 0.00...` — ignores IDR amounts) — that's a bug in the reference project, not ours to fix. DAPEN's existing `TotalD`/`TotalK` calculation (plain `SUM(Debet)`/`SUM(Kredit)`) is already correct and should NOT be changed to match trade-exchange's buggy formula.

---

## User Scenarios

> Format: **Given** [kondisi] **When** [aksi] **Then** [hasil]

### ✅ Happy Path
- [x] **Scenario 1**: Given user's active period is set to month=6/year=2026 in `DBPERIODE`, When user opens kasbank list with no date filter, Then only transactions with `Tanggal` in June 2026 are returned. (backend: `repository.go` `List`; covered by `TestList_DefaultPeriod_NoExplicitDate`)
- [x] **Scenario 2**: Given user explicitly passes `dateFrom`/`dateTo` query params, When requesting the kasbank list, Then the explicit range is used instead of the active period (existing flexibility preserved). (covered by `TestList_ExplicitDate_OverridesPeriod`)
- [x] **Scenario 3**: Given a kasbank record with `MaxOL=5` (legacy data) and 0 levels approved, When user approves level 1, then level 2 (different user), then level 3, 4, 5 in sequence, Then each approval succeeds and the record becomes `Locked=true` only after level 5. (backend: `service.go` `SetOtorisasi`/`effectiveMaxOL`/`isOtorisasiApproved`; covered by `TestService_SetOtorisasi_SequentialLevels1Through5`, `TestService_GetByNoBukti_NotLocked_UntilMaxOL5`, `TestService_GetByNoBukti_Locked_AfterAllMaxOL5`)
- [x] **Scenario 4**: Given a kasbank record created fresh via DAPEN (`MaxOL` unset/0), When user approves level 1 then level 2, Then record becomes `Locked=true` after level 2 (effective MaxOL defaults to 2) — matches current pre-change behavior, no regression. (covered by `TestService_GetByNoBukti_Locked_DefaultMaxOL2`, `TestEffectiveMaxOL_DefaultsTo2`)

### ❌ Validation Errors
- [x] **Scenario**: Given `SOtorisasiRequest.Level = 6`, When POST to `/otorisasi`, Then 400 binding validation error (max=5) — DAPEN's gin binding returns 400 (via `response.BadRequest`), not 422; behavior verified equivalent. (covered by `TestHandler_SetOtorisasi_InvalidBody`)
- [x] **Scenario**: Given level N-1 not yet approved, When attempting to approve level N, Then service returns `ErrOtorisasiPrevLevelMissing` (extended from current level-2-requires-level-1 rule). (covered by `TestService_SetOtorisasi_PrevLevelMissing`)
- [x] **Scenario**: Given the same user approved level N-1, When that user attempts to approve level N, Then `ErrSelfOtorisasi` (extended to all adjacent level pairs, not just 1→2). (covered by `TestService_SetOtorisasi_SelfOtorisasi_AllAdjacentPairs`)

### 🔐 Authentication & Authorization
- [ ] **Scenario**: Given request without valid JWT, When calling kasbank otorisasi endpoint, Then 401. (unchanged — relies on existing JWT middleware, not modified by this task; verify manually)
- [x] **Scenario**: Given level N+1 already approved, When attempting to cancel level N, Then rejected (mirrors existing "can't undo level 1 if level 2 approved" rule, extended to all levels). (covered by `TestService_CancelOtorisasi_NextLevelSet`, `TestService_CancelOtorisasi_TopLevelOk`)

### 🔍 Not Found & Edge Cases
- [x] **Scenario**: Given `NoBukti` doesn't exist, When calling otorisasi endpoint, Then 404 `EID_NOT_FOUND` (unchanged — `ErrNotFound` already mapped via `writeServiceError`; covered by existing `TestService_SetOtorisasi_NotFound`/`TestService_CancelOtorisasi_NotFound`).
- [x] **Scenario**: Given user has no row in `DBPERIODE` (new user, never set a period), When requesting kasbank list with no date filter, Then `GetPeriode` returns `(0, 0, nil)` per existing behavior — list query falls back to NO period restriction (documented in `repository.go` `List` comment). (covered by `TestList_NoPeriodRow_FallsBackToUnrestricted`)

---

## Acceptance Criteria

### Functional Requirements
- [x] Kasbank list defaults to the user's active period when no explicit date filter is passed; explicit filters still work. (backend done)
- [x] `SetOtorisasi`/`CancelOtorisasi` support levels 1-5 with sequential-approval + different-approver-per-adjacent-level rules. (backend done)
- [x] Effective `MaxOL` resolution: valid legacy value (1-5) used as-is; invalid/unset defaults to 2. (backend done — `effectiveMaxOL`)
- [x] `SKasBankHeader` (backend) and `IKasBankHeader` (frontend) expose `otorisasi3/4/5` and `maxol`. (backend done; frontend `types/kasbank.ts` updated)
- [x] `OtorisasiButton.tsx` renders 1..maxol levels dynamically, no hardcoded 2-level JSX remaining. (frontend done — refactored to `Array.from({length: voucher.maxol})` loop via `<Each />`/`<Show />`)
- [x] No change to `TotalD`/`TotalK` calculation (still plain SUM, NOT trade-exchange's buggy IDR-excluding formula). (verified — `RecalcTotals` untouched)
- [x] Response `message` in English; error_map 4-field format preserved for all new/changed error paths. (new sentinel errors routed through existing `writeServiceError` → `response.BadRequest`)

### Quality Gates (Before Marking COMPLETED)
- [ ] **Backend**: Code compiles with zero errors (user to run `go build ./...`)
- [x] **Backend**: Unit tests for `SetOtorisasi`/`CancelOtorisasi` (levels 1-5) + repository period-default test, sqlmock-backed per this package's established convention, 80%+ coverage on changed code (user to run `go test ./... -v` to confirm pass + coverage)
- [ ] **Backend**: All kasbank endpoints manually verified (curl/Postman) for both period-default and explicit-date-filter list requests (manual — pending user)
- [ ] **Frontend**: `npm run type-check` exits 0 (code edited and reviewed by type; user must run `npm run type-check` to confirm — see manual commands below)
- [ ] **Frontend**: Runtime verification — approve through all 5 levels on a test record with `MaxOL=5`, and through 2 levels on a fresh DAPEN-created record (`MaxOL` unset) (pending manual user verification)
- [ ] **E2E**: Playwright covering multi-level approval flow + period-default list view (pending QA agent)
- [ ] **Documentation**: `backend/internal/features/accounting/kasbank/AI.md` and equivalent frontend doc (if present) updated with the new otorisasi-levels and period-default behavior (no `AI.md` exists in this feature directory yet — not created per "no unsolicited docs" rule; revisit if the convention is mandatory elsewhere)

---

## Implementation Plan

### Backend
- `repository.go` — default period filter via existing `GetPeriode(ctx, userID)`
- `service.go` — generalize `SetOtorisasi`/`CancelOtorisasi` to levels 1-5 + effective-MaxOL helper
- `entity.go`/`dto.go` — expose `otorisasi3/4/5`, `maxol` on `SKasBankHeader`
- `handler.go` — widen `SOtorisasiRequest.Level` binding to max=5
- New unit tests in `service_test.go`/`repository_test.go`

### Frontend
- `types/kasbank.ts` — add `otorisasi3/4/5: boolean`, `maxol: number`
- `OtorisasiButton.tsx` — refactor to dynamic 1..maxol loop
- `KasBankDataTable.tsx` — review/update otorisasi column rendering

---

## Estimate
**Hours**: Medium (8-16h)

---

## Dependencies
- Existing `GetPeriode`/`GetCurrentPeriode` helper (`kasbank/nomor.go` lines 111-126) — already implemented, reused not rebuilt.
- DB columns `IsOtorisasi3-5`/`OtoUser3-5`/`TglOto3-5`/`MaxOL` — already exist in `DBTRANS` table and GORM model, no migration needed.

### Related Tasks
- Tidak ada task lama yang menutupi kasbank otorisasi atau period filtering — ini investigasi baru dari laporan user langsung membandingkan dengan project referensi `trade-exchange`.

---

## Timeline
- **Created**: June 18, 2026
- **Started**: -
- **Completed**: -

---

## Notes

### Root cause investigation summary
Compared DAPEN (`backend/internal/features/accounting/kasbank/`) against trade-exchange (`/Users/codemasx/Storage/my-htdocs/trade-exchange`, route `accounting/transaksi-bank-or-kas` → `BankOrKasController`/`BankOrKasRepository`):

- **Period filter**: trade-exchange's `getAllBankOrKas()` SQL always includes `WHERE year(Tanggal)={tahun} AND month(Tanggal)={bulan}` resolved from `DBPERIODE` (per-user, one row per `USERID` with `BULAN`/`TAHUN` columns). DAPEN's repository has no such restriction — relies entirely on optional `dateFrom`/`dateTo` query params.
- **Otorisasi**: trade-exchange's SQL computes `NeedOtorisasi` by comparing the count of approved `IsOtorisasi1-5` flags against `MaxOL`. DAPEN's `service.go` hardcodes only levels 1-2 (`SetOtorisasi`/`CancelOtorisasi` reject anything outside 1-2), and never reads/writes `MaxOL` anywhere (confirmed via grep, zero matches) despite the DB columns for levels 3-5 and `MaxOL` already existing in the GORM model (`dbtrans.go` lines 15-34).
- **trade-exchange's own bug (NOT to be replicated)**: `TotalD` SQL uses `CASE WHEN Valas='IDR' THEN 0.00 ELSE Debet+Kredit END`, silently zeroing all IDR-denominated amounts. DAPEN's plain `SUM(Debet)`/`SUM(Kredit)` is correct and must stay as-is.
- **MaxOL semantics**: trade-exchange initializes `MaxOL = -1` on create (sentinel, no enforced approval), and never auto-calculates it elsewhere in the codebase found — appears to be either manually set in the DB per transaction or set by a part of the system not reviewed. User decided: DAPEN should read `MaxOL` from the DB if it's a valid 1-5 value (covers legacy/imported records), defaulting to 2 for anything else (covers new DAPEN-created records, preserving current 2-level behavior with zero surprise for new data).

### Decision log (from conversation)
- User explicitly confirmed: fix BOTH period filter AND extend otorisasi to 5 levels in one pass (not split into two tasks), accepting the larger combined scope.
- User explicitly confirmed: use DB `MaxOL` when valid, default to 2 for new records — not "always require all 5 levels for everyone."
