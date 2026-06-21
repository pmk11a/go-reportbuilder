<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-022: Kasbank List View-Model Fix + Jumlah (Valas)/Jumlah (Rupiah) Columns + Otorisasi Detail Tooltip

## Related Tasks
- TASK-021 (Kasbank — Default Period Filter + 5-Level Otorisasi): this task fixes a gap discovered while manually verifying TASK-021's frontend behavior against the trade-exchange reference (`/Users/codemasx/Storage/my-htdocs/trade-exchange`). TASK-021 added 5-level otorisasi support and period-default filtering; this task fixes the list endpoint that never surfaced any of it correctly.

## Business Problem
Comparing the DAPEN kasbank list (`/admin/accounting/kasbank`) against the trade-exchange reference (`accounting/transaksi-bank-or-kas`) for the same period showed every row with `Total = 0,00` and `Otorisasi = Menunggu` regardless of actual approval state in the DB. Root cause: `SKasBankService.List()` (`backend/internal/features/accounting/kasbank/service.go` lines 113-130) returns raw `SDbTrans` rows directly, never converting them to the `SKasBankHeader` view-model that `GetByNoBukti()` already builds (lines 135-169). Consequences:
- No `RecalcTotals` call → response has no `totald`/`totalk` fields at all (raw `SDbTrans` has no such columns) → frontend's `Number(voucher.totald ?? 0)` always renders `0,00`.
- Raw JSON key is `isotorisasi1..5` (legacy column-derived), but frontend's `IKasBankHeader` type expects `otorisasi1..5` → field never matches → `OtorisasiButton` always treats 0 levels as approved.
- No `locked` field, no effective `maxol` (`effectiveMaxOL()` never applied) → `Array.from({ length: voucher.maxol })` evaluates with `undefined` length → zero level buttons rendered → "Menunggu" badge shown unconditionally.

Separately, the user wants the table's amount/otorisasi presentation to match trade-exchange's reference columns (`Jumlah (Valas)`, `Jumlah (Rupiah)`, `Authorized N`/`User N`/`Date N`), with two explicit design decisions already made in conversation:
1. Add `Jumlah (Valas)` (= `SUM(CASE WHEN Valas<>'IDR' THEN Debet+Kredit ELSE 0 END)`, correctly labeled — trade-exchange's same formula was previously flagged as a "bug" in TASK-021 because it mislabeled this foreign-currency total as `TotalD`; computed correctly and labeled accurately here, it is not a bug) and `Jumlah (Rupiah)` (= `SUM((Debet+Kredit)*Kurs)`, same as trade-exchange's `TotalRp`), replacing the current single `Total` column.
2. Keep the existing compact `OtorisasiButton` badge UI, but REPLACE the column entirely: swap the single 1-column `Otorisasi` (badge) for 3×MaxOL columns (`Authorized N`, `Authorized User N`, `Authorized Date N`), matching trade-exchange's wide-layout pattern exactly. Instead of a shared `DetailTooltip`, each approved-level column cell shows the approver/date inline (matching trade-exchange's `AUTHORIZED 1`, `AUTHORIZED USER 1`, `AUTHORIZED DATE 1` columns). The OtorisasiButton component stays for the locked voucher state (the undo icon button and the locked badge icon).

**Acceptance Criteria — Backend** (same as before + 1 new):
- [ ] `SKasBankService.List()` converts every returned row to the `SKasBankHeader` view-model (same field semantics as `GetByNoBukti()`: `otorisasi1..5`, effective `maxol` via `effectiveMaxOL()`, `locked` via `isOtorisasiApproved()`).
- [ ] Totals for the current page are computed via a single **batch** aggregate query against `DBTRANSAKSI` (`WHERE NoBukti IN (...) GROUP BY NoBukti`) — NOT one query per row (no N+1).
- [ ] New `SKasBankHeader` fields: `JumlahValas` (`jumlahvalas` json), `JumlahRupiah` (`jumlahrupiah` json), `OtoUser1..5` (`otouser1..5` json), `TglOto1..5` (`tgloto1..5` json). (These are now used as column content, not tooltip content — same data shape, different consumption.)
- [ ] `GetByNoBukti()` updated to populate the same new fields (so the detail view and list view are consistent).
- [ ] `TotalD`/`TotalK` (existing fields) remain unchanged in meaning (sum Debet / sum Kredit across all currencies) — used internally for double-entry validation elsewhere; not removed.
- [ ] Go compiles with zero errors; unit tests added/updated for `List()` (batch totals, effective maxol, locked) and the new aggregate fields. No mocked DB — follow existing `repository_test.go`/`service_test.go` conventions (real test DB per `backend/CLAUDE.md`).

### Frontend
- [ ] `IKasBankHeader` type (`frontend/src/domains/accounting/types/kasbank.ts`) gains `jumlahvalas`, `jumlahrupiah`, `otouser1..5`, `tgloto1..5`.
- [ ] `KasBankDataTable.tsx`: `Total` column replaced by two columns, `Jumlah (Valas)` and `Jumlah (Rupiah)` (i18n keys added to `locales/{en,id}/accounting.json`).
- [ ] New shared component `DetailTooltip` in `frontend/src/shared/ui/feedback/` — generic, reusable (not kasbank-specific), built on the existing `Tooltip`/`TooltipTrigger`/`TooltipContent`/`TooltipProvider` primitives already in `tooltip.tsx`.
- [ ] `OtorisasiButton.tsx`: each approved-level badge uses `DetailTooltip` to show `OtoUserN` + formatted `TglOtoN` on hover. Unapproved/pending-action buttons unchanged.
- [ ] `npm run type-check` passes (user-run). No raw `.map()`/ternary/`&&` introduced in JSX (use `Each`/`Show`).

## User Scenarios

### ✅ Happy Path
- [ ] **Scenario 1**: Given a kasbank voucher with `IsOtorisasi1=1` approved by user "ENY" and 2 detail lines (Valas='IDR', Valas='USD'), When the list endpoint is called, Then the response item has `otorisasi1=true`, `otouser1="ENY"`, `jumlahvalas` equal to the USD line's Debet+Kredit only, and `jumlahrupiah` equal to the sum of both lines' Rupiah-converted amounts.
- [ ] **Scenario 2**: Given a page of 10 kasbank vouchers, When the list endpoint is called, Then exactly one aggregate query is issued against `DBTRANSAKSI` for the whole page (not 10 separate queries).
- [ ] **Scenario 3**: Given a fully-approved, locked voucher, When viewing it in the frontend table, Then the `Otorisasi` badges show all approved levels and hovering one shows the approving user and date via `DetailTooltip`.

### ❌ Validation / Edge Cases
- [ ] **Scenario**: Given a voucher with zero detail lines, When listed, Then `jumlahvalas`/`jumlahrupiah`/`totald`/`totalk` are all `0`, not `null` or a query error.
- [ ] **Scenario**: Given a legacy voucher with `MaxOL` unset (0), When listed, Then effective `maxol` defaults to 2 (existing TASK-021 behavior, unchanged).

## Implementation Plan
See Business Problem section for full root-cause detail. Summary:
1. Backend: add batch totals aggregation helper in `repository.go` (e.g. `GetAggregateTotals(ctx, noBuktis []string) (map[string]SAggregateTotals, error)`), wire into `service.go` `List()` to build `[]SKasBankHeader` instead of returning raw `[]SDbTrans`. Update `dto.go` `SListKasBankResponse.Items` type accordingly. Extend `SKasBankHeader` (`entity.go`) with the new fields. Update `GetByNoBukti()` similarly for consistency.
2. Frontend: update `IKasBankHeader`, `KasBankDataTable.tsx` columns, new `DetailTooltip` shared component, `OtorisasiButton.tsx` integration.

## Testing Approach
- Backend: unit tests in `repository_test.go` (batch aggregate query) and `service_test.go` (view-model conversion, effective maxol/locked correctness) — real test DB, no mocks.
- Frontend: manual verification (per `frontend/CLAUDE.md`, no automated build/test run by agents) — user runs `./scripts/check-all.sh`.

## Estimate
**Hours**: 10-14 (Medium — backend aggregate query + view-model refactor, frontend type/column/shared-component changes)

## Dependencies
- TASK-021 (effectiveMaxOL, isOtorisasiApproved, 5-level otorisasi columns already exist)

## Risks & Mitigations
- **Risk**: Batch aggregate query complexity for large pages — mitigate by aggregating only for the NoBukti values in the current page (already paginated, max `perPage` rows).
- **Risk**: Changing `SListKasBankResponse.Items` type from `[]SDbTrans` to `[]SKasBankHeader` is a breaking response-shape change for any other consumer of this endpoint — confirmed only the kasbank frontend list page consumes it; no other callers found in this codebase.

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Backend unit tests passing, no N+1 query
- [ ] `npm run type-check` passes (user-run)
- [ ] CLAUDE.md files updated if endpoints/shared components changed
