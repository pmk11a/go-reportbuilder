<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-010: COA / Perkiraan Master Management

## Business Problem
The COA (Chart of Accounts, in Indonesian: **Perkiraan** or **Bagan Akun**) is the foundation of every accounting transaction. The legacy `be-dapenka-userlog` Laravel system had:
- A read-only `vwPerkiraan` SQL view for searching/listing COA.
- A per-user access list in `DBAKSESPERKIRAAN` (gates which COA each user can post against).
- A `searchPerkiraan` autocomplete for transaction forms.

The current `golang-next` rebuild has:
- `GET /api/perkiraan` (search filter for the `PerkiraanSelect` widget) — already in place.
- A `PerkiraanSelect` component (used across forms).
- A COA access tab inside `UserPermissionsDialog` (per-user, works).

What's MISSING:
1. **No admin CRUD** for the master `dbperkiraan` table — there is no way to create, edit, or delete COA from the UI.
2. **No admin page** at `/admin/master-data/perkiraan`.
3. **No autocomplete with per-user access filtering** — the existing `PerkiraanSelect` does not filter by the current user's `DBAKSESPERKIRAAN` access list (it returns all COA from the table).
4. **No i18n namespace** for the COA master page.

This task adds the full admin CRUD + an enhanced autocomplete (per-user access filtered) + dedicated i18n.

## Priority: High

## Status
📋 **TODO**

## Acceptance Criteria

### Backend (COA Master API)
- [ ] `IPerkiraanRepository` interface + `SPerkiraanRepository` implementation, with methods:
  - `List(search, kelompok, tipe, page, perPage) ([]SDbPerkiraan, int64, error)`
  - `GetByID(perkiraan string) (*SDbPerkiraan, error)`
  - `Create(payload SPerkiraanPayload) (*SDbPerkiraan, error)`
  - `Update(perkiraan string, payload SPerkiraanPayload) (*SDbPerkiraan, error)`
  - `Delete(perkiraan string) error`
  - `SearchAutocomplete(q string, userID int, limit int) ([]SDbPerkiraan, error)` — joins `DBAKSESPERKIRAAN` for per-user access filter
- [ ] `IPerkiraanService` interface + impl with business validation (`Perkiraan` cannot be empty, `Tipe` ∈ {1,2,3}, etc.)
- [ ] `SPerkiraanPayload` and `SPerkiraanListResponse` DTOs
- [ ] `perkiraan_handler.go` with 6 handlers (list, get, create, update, delete, autocomplete)
- [ ] All handlers gated by `AuthMiddleware` + `RoleMiddleware("admin")`
- [ ] All handlers use `utils.Success/Error/Created/BadRequest/NotFound/InternalError`
- [ ] Routes registered:
  - `GET /api/admin/perkiraan` (list, paginated, with `?search=`, `?kelompok=`, `?tipe=`, `?page=`, `?perPage=`)
  - `GET /api/admin/perkiraan/{kode}` (detail)
  - `POST /api/admin/perkiraan` (create)
  - `PUT /api/admin/perkiraan/{kode}` (update)
  - `DELETE /api/admin/perkiraan/{kode}` (delete)
  - `GET /api/admin/perkiraan/autocomplete?q=&userId=&limit=` (autocomplete with per-user filter)
- [ ] Swaggo annotations on every handler
- [ ] `swag init` runs clean
- [ ] Tests:
  - `perkiraan_repository_test.go` (mocked SQL via `DATA-DOG/go-sqlmock`)
  - `perkiraan_service_test.go` (testify + mock repo)
  - `perkiraan_handler_test.go` (httptest)
- [ ] `go build ./...` exits 0
- [ ] `go test ./...` exits 0; `coverage_tested` ≥80%

### Frontend (COA Admin Page)
- [ ] `IPerkiraan`, `IPerkiraanPayload`, `IPerkiraanFilter`, `IPerkiraanListResponse` types
- [ ] `perkiraanService.ts` with 6 functions (list, getByID, create, update, delete, autocomplete)
- [ ] `usePerkiraan.ts` with 6 hooks (usePerkiraanList, usePerkiraan, useCreatePerkiraan, useUpdatePerkiraan, useDeletePerkiraan, usePerkiraanAutocomplete)
- [ ] BFF proxy `frontend/src/api-handlers/admin/perkiraan/index.ts` (6 endpoints)
- [ ] `PerkiraanDataTable` component (Shadcn-style, sortable, searchable, paginated)
- [ ] `PerkiraanFormDialog` component (react-hook-form + zod, all 15 fields)
- [ ] `PerkiraanFilters` component (filter bar)
- [ ] New page at `/admin/master-data/perkiraan` (DataTable + add button + row actions)
- [ ] Admin sidebar updated to include "Master Perkiraan" link
- [ ] NO Glassmorphism in any new component (Shadcn-style only)
- [ ] `npm run type-check` exits 0
- [ ] `npm test -- --run` exits 0

### Frontend (Enhanced Autocomplete)
- [ ] `PerkiraanAutocomplete` component (cmdk-based, calls `perkiraanService.autocomplete(q, currentUserId, 20)`)
- [ ] The autocomplete filters by the current user's `DBAKSESPERKIRAAN` access list (server-side)
- [ ] The existing `PerkiraanSelect` is preserved (additive — both can coexist)

### Frontend (i18n)
- [ ] New `frontend/src/locales/en/perkiraan.json` namespace created
- [ ] New `frontend/src/locales/id/perkiraan.json` namespace created
- [ ] All new user-facing strings are in **both** locales
- [ ] i18n loads the new namespace

### Quality Gates
- [ ] `./scripts/check-all.sh` exits 0
- [ ] At least 1 Playwright E2E test for the COA admin page (login as admin → navigate → add → edit → delete)
- [ ] At least 1 Playwright E2E test for the autocomplete (login → open form with autocomplete → type → assert filtered results)
- [ ] Per-feature `AI.md` files updated (rule #15)
- [ ] No secrets committed

## User Stories

**As an** admin
**I want** to create, edit, and delete COA from a dedicated page
**So that** I can manage the chart of accounts without needing direct SQL access.

**As an** admin
**I want** a DataTable view of all COA with search and filter
**So that** I can find a specific COA quickly among thousands of records.

**As a** user filling out a transaction form
**I want** the COA autocomplete to only show COA I'm allowed to post against
**So that** I don't pick a COA I don't have access to (which would be rejected by the backend).

**As an** admin
**I want** the COA admin page to be fully localized in English and Indonesian
**So that** users can work in their preferred language.

## Implementation Plan

### Phase 1: Backend (delegate to `@dapen-backend`)
1. Create `backend/internal/repositories/perkiraan_repository.go` with `IPerkiraanRepository` interface + `SPerkiraanRepository` implementation.
2. Create `backend/internal/services/perkiraan_service.go` with `IPerkiraanService` interface + `SPerkiraanService` implementation.
3. Create `backend/internal/dto/perkiraan_dto.go` with `SPerkiraanPayload`, `SPerkiraanListResponse`.
4. Create `backend/internal/handlers/perkiraan_handler.go` with 6 handlers.
5. Register 6 routes in `backend/internal/routes/routes.go`.
6. Add Swaggo annotations; run `swag init`.
7. Create `backend/internal/repositories/perkiraan_repository_test.go`.
8. Create `backend/internal/services/perkiraan_service_test.go`.
9. Create `backend/internal/handlers/perkiraan_handler_test.go`.
10. Run `./scripts/check-all.sh --backend-only` and fix all errors in batch.

### Phase 2: Frontend (delegate to `@dapen-frontend`)
1. Create `frontend/src/types/perkiraan.ts` with `IPerkiraan`, `IPerkiraanPayload`, `IPerkiraanFilter`, `IPerkiraanListResponse`.
2. Create `frontend/src/services/perkiraanService.ts` with 6 functions.
3. Create `frontend/src/hooks/usePerkiraan.ts` with 6 hooks.
4. Create BFF proxy `frontend/src/api-handlers/admin/perkiraan/index.ts`.
5. Create `frontend/src/components/admin/perkiraan/PerkiraanDataTable.tsx`.
6. Create `frontend/src/components/admin/perkiraan/PerkiraanFormDialog.tsx` (all 15 fields, react-hook-form + zod).
7. Create `frontend/src/components/admin/perkiraan/PerkiraanFilters.tsx`.
8. Create `frontend/src/components/admin/perkiraan/index.ts` (barrel).
9. Create `frontend/src/routes/admin/_layout/master-data/perkiraan/index.tsx`.
10. Update admin sidebar to include "Master Perkiraan" link.
11. Create `frontend/src/components/shared/filters/PerkiraanAutocomplete.tsx` (cmdk-based).
12. Add new i18n keys to `locales/en/perkiraan.json` and `locales/id/perkiraan.json`.
13. Register `perkiraan` namespace in `frontend/src/lib/i18n.ts`.
14. Run `./scripts/check-all.sh --frontend-only` and fix all errors in batch.

### Phase 3: QA (delegate to `@dapen-qa`)
1. Write 1+ Playwright E2E test for the COA admin page (CRUD flow).
2. Write 1+ Playwright E2E test for the autocomplete (per-user filter).
3. Update User Scenarios with emoji checklist.
4. Run `./scripts/check-all.sh` end-to-end.

## Testing Approach
- **Unit (Go):** testify + mockery for services/handlers; DATA-DOG/go-sqlmock for repository. Aim for ≥80% on `coverage_tested`.
- **Unit (TS):** Vitest + Testing Library for hooks + form dialog validation.
- **E2E:** Playwright for the admin page and the autocomplete.
- **Manual:** Login as admin, open `/admin/master-data/perkiraan`, add/edit/delete a COA. Open a form with autocomplete, type, verify results.

## Estimate
**Hours**: 12-20

## Dependencies
- Existing `SDbPerkiraan` model in `backend/internal/models/dbperkiraan.go` (do not recreate).
- Existing `SDBAKSESPERKIRAAN` model in `backend/internal/models/dbaksesperkiraan.go` (used for per-user filter).
- Existing `frontend/src/components/ui/*` (Shadcn-style).
- `scripts/check-all.sh` — final gate.
- `react-hook-form` + `zod` (already in package.json).

## Risks & Mitigations
- **Risk:** The `SDbPerkiraan` table is a legacy SQL Server table — adding `CreatedAt`/`UpdatedAt` columns is forbidden (root `AI.md` rule).
  - **Mitigation:** No migrations; use GORM to read/write the existing columns only.
- **Risk:** Deleting a COA might break existing transactions.
  - **Mitigation:** Add a confirmation dialog with a "type the COA code to confirm" extra step. Optionally: soft-delete via a flag if it exists; for v1, hard delete is acceptable per the legacy behavior.
- **Risk:** The autocomplete might return too many results for popular COA codes.
  - **Mitigation:** Server-side `limit=20`; client-side debounce 300ms; client-side fuzzy match with cmdk.
- **Risk:** Per-user access filter in autocomplete might be slow on a large `DBAKSESPERKIRAAN` table.
  - **Mitigation:** The existing `DBAKSESPERKIRAAN` is keyed by `(UserID, Perkiraan)` — fast lookups. SQL Server handles this efficiently with the existing index.

## Definition of Done
- [ ] All Acceptance Criteria checked off
- [ ] `./scripts/check-all.sh` exits 0
- [ ] Backend `coverage_tested` ≥80%
- [ ] Per-feature `AI.md` files updated
- [ ] Manual smoke test of the admin page passes
- [ ] Manual smoke test of the autocomplete passes
- [ ] Committed with `feat: TASK-010 COA master management`

## Notes
- The existing `GET /api/perkiraan` endpoint (`filter_handler.go`) is for the **shared filter** used by the `PerkiraanSelect` widget. The new admin endpoints are at `/api/admin/perkiraan/*` and are separate. They can coexist.
- The `SDbPerkiraan` model has 15 fields: Perkiraan, Kelompok, Tipe, DK, Valas, KodeAK, KodeSAK, Keterangan, Simbol, FlagCashFlow, Neraca, IsPPN, GroupPerkiraan, Lokasi, MyID. The FormDialog must expose all of them (or at least the most-used subset, with a "Show advanced" toggle).
- The per-user access filter in `SearchAutocomplete` is the key UX improvement: a user without access to a COA will NOT see it in the autocomplete, eliminating the "access denied" error at save time.

---
*Last Updated: June 3, 2026*
