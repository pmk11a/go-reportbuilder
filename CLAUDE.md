# CLAUDE.md — DAPEN Project Root

## Architecture Model

- **Backend:** Domain-Based + DDD-Lite + Layered (handler → service → repository → entity per domain)
- **Frontend:** Strict Separation of Concerns (Types → Services → Hooks → Components)
- **Pattern:** Server Functions (TanStack Start) via `frontend/src/server/functions/`; JWT held in Redis sessions, session ID in HttpOnly cookies

---

## RULE #0: Plan Mode Before Implementation (CRITICAL)

**NEVER start editing code for large work without Plan Mode approval.**

| Request type | Requires Plan Mode? |
|---|---|
| Migrasi framework/teknologi | ✅ WAJIB — enter plan mode, get user approval, THEN edit |
| Feature baru | ✅ WAJIB |
| Refactor besar (>4h) | ✅ WAJIB |
| Bug fix / cleanup ringan | ❌ Langsung |

**After plan is approved → create/update task file FIRST → then start coding.**

Violation of this rule = immediate revert + self-improve.

---

## RULE #1: Delegation (CRITICAL)

**YOU ARE THE ARCHITECT, NOT THE BUILDER.**

Always delegate implementation to specialized agents:
- Backend work → `@dapen-backend`
- Frontend work → `@dapen-frontend`
- E2E / QA → `@dapen-qa`

Do direct work only for: quick reads, 1-2 line edits, simple shell commands, agent coordination.

---

## RULE #2: Auto Self-Improvement (MANDATORY)

> Full specification: `RULES.md` §7 (global, berlaku semua project Mamorasoft)

After every bug fix, error resolution, or pattern discovery — **automatically evaluate** whether skills/agents need updating. Propose changes; user confirms before write.

---

## Core Rules

1. **ENGLISH MANDATORY** — All code, comments, and `.md` files in English. No Indonesian in code or docs.
2. **MANDATORY TESTING** — Create E2E (Playwright) + Unit tests for every new feature or code change. TDD encouraged.
3. **No duplicate code** — Abstract shared logic into `utils/` or `hooks/`.
4. **Read before write** — Always read files before editing.
5. **Prefer edit over create** — Modify existing files when possible.
6. **No unsolicited docs** — Only create documentation when explicitly asked.
7. **Never commit secrets** — No API keys, passwords, or sensitive data.
8. **DILARANG GIT COMMAND TANPA PERINTAH** — `git stash`, `git stash drop`, `git checkout`, `git commit`, `git push` — JANGAN PERNAH dijalankan tanpa perintah eksplisit dari user, termasuk saat auto-edit mode aktif atau bypass permission on. Tidak ada pengecualian.
8. **Use existing patterns** — Follow Domain-Based architecture and TanStack Start server function conventions.
9. **One feature per task** — Create a separate task file in `tasks/` per distinct feature before starting. Do not combine unrelated features.
10. **Verify compilation** — Go code MUST compile with zero errors before handoff.
11. **Mandatory runtime verification** — React app MUST run without errors on all pages with all data scenarios. `npm run type-check` must pass.
12. **Design system enforcement** — Use ONLY components from `frontend/src/components/ui`. NO Glassmorphism.
13. **Complete resolution only** — Never stop at "good enough".
14. **Progressive quality gates** — Verify quality continuously, not just at completion.
15. **Update feature CLAUDE.md** — When changing ANY feature code, update its contextual `CLAUDE.md` in the SAME commit.
16. **BATCH ERROR COLLECTION (MANDATORY)** — When the user needs a quality-gate run, NEVER run individual checks one-by-one and fix in a loop. The user runs `./scripts/check-all.sh` and shares the output; agents read the batched artifacts in `tmp/latest/*` and group errors by file before fixing. **Agents and skills MUST NOT execute `check-all.sh` (or any build/test/type-check/lint/codegen) themselves** — see global RULES.md §2.
17. **DATA RENDERING (MANDATORY)** — All UI components MUST use `<Each />` and `<Show />` from `frontend/src/components/ui/layout/Render.tsx`. Do NOT use raw `.map()`, `&&`, or `? :` ternaries in TSX return blocks.

---

## Tech Stack

**Backend:** Go 1.20+ · Gin · GORM · SQL Server (legacy) · MongoDB · Redis · JWT · Swaggo/Swagger

**Frontend:** React 19 · TanStack Start (SSR + Server Functions) · TanStack Router · TanStack Query · Zustand · Tailwind v4 · react-i18next

---

## Project Structure

```
dapen-golang-next/
├── .claude/
│   ├── agents/          # Subagent manifests (dapen-backend, dapen-frontend, dapen-qa)
│   ├── skills/          # Skill definitions (scaffolding)
│   ├── commands/        # Slash commands (architect)
│   └── settings.json
├── tasks/               # Task tracking (TASK-XXX-*.md)
│   └── CLAUDE.md        # Task lifecycle & templates
├── frontend/
│   ├── CLAUDE.md        # Frontend quick reference
│   └── src/
│       ├── server/       # Server-side (functions, middleware, session, redis)
│       ├── lib/          # Client utilities (fetchInterceptor, query-client)
│       ├── components/   # UI atoms + admin-specific components
│       ├── hooks/        # TanStack Query hooks
│       ├── locales/      # i18n (en + id)
│       ├── routes/       # TanStack Router (file-based)
│       ├── services/     # Service layer (calls server functions)
│       ├── store/        # Zustand global state (skipHydration for persist)
│       ├── types/        # Centralized TypeScript types
│       ├── utils/        # Pure helpers (errorMapper, etc.)
│       └── ...            # api-handlers/ and bff/ deleted (Phase 6)
├── backend/
│   ├── CLAUDE.md        # Backend quick reference
│   ├── cmd/             # Entry point (main.go)
│   └── internal/
│       ├── shared/      # Technical concerns (auth, cache, db, response, middleware...)
│       ├── identity/    # Domain: user, permission, auth
│       ├── accounting/  # Domain: perkiraan, periode, jurnal
│       ├── menu/        # Domain: master menu catalogue
│       ├── reports/     # Domain: permission_report
│       └── ...
└── scripts/
    └── check-all.sh     # MANDATORY quality gate
```

---


---

## SQL Server 2008 Query Standards (MANDATORY)

The legacy Laravel application runs on **SQL Server 2008 R2**. All raw SQL queries in Go backend code MUST use syntax compatible with SQL Server 2008 R2 and follow these standards:

### 1. Bracket Quoting for Column Names (REQUIRED)

SQL Server columns in `DBTRANSAKSI`, `DBNOMOR`, `DBPERKIRAAN`, and other legacy tables may contain uppercase names with spaces. **Bracket quoting `[column]` is REQUIRED** — do NOT use backticks, double quotes, or plain identifiers:

```go
// ✅ CORRECT — bracket-quoted columns
tx.Raw("SELECT [No Bukti] FROM DBTRANSAKSI WHERE [IsOtorisasi1] = ?", 1)

// ❌ WRONG — backticks (MySQL syntax)
tx.Raw("SELECT `NoBukti` FROM DBTRANSAKSI ...")

// ❌ WRONG — plain identifier (fails on column names with spaces)
tx.Raw("SELECT NoBukti FROM DBTRANSAKSI ...")

// ❌ WRONG — double quotes (PostgreSQL syntax)
tx.Raw(`SELECT "NoBukti" FROM DBTRANSAKSI ...`)
```

### 2. Row Locking for Concurrent Updates

When reading/writing sequence numbers (voucher numbering via `DBNOMOR`), ALWAYS use `(UPDLOCK, HOLDLOCK)` table hints to prevent race conditions under SQL Server 2008's default isolation level (READ COMMITTED):

```go
// ✅ CORRECT — UPDLOCK/HOLDLOCK prevents double-voucher bug
tx.Raw("SELECT [PEMISAH] FROM DBNOMOR WITH (UPDLOCK, HOLDLOCK)")
tx.Raw("UPDATE DBNOMOR SET [FORMAT1] = [FORMAT1] + 1 WHERE [ALIAS] = ?", tipe)

// ❌ WRONG — no lock hint (concurrent inserts can generate identical NoBukti)
tx.Raw("SELECT [PEMISAH] FROM DBNOMOR")
```

Supported table hints:
- `UPDLOCK` — acquire update lock instead of shared lock
- `HOLDLOCK` — hold lock until transaction end (SERIALIZABLE equivalent)

### 3. Legacy Uppercase Column Names

All legacy table columns are stored in **UPPERCASE** in the database. Match column names exactly in raw SQL:

| Table | Column | Raw SQL |
|---|---|---|
| `DBTRANSAKSI` | `NoBukti` | `[NoBukti]` |
| `DBTRANSAKSI` | `Tanggal` | `[Tanggal]` |
| `DBTRANSAKSI` | `IsOtorisasi1` | `[IsOtorisasi1]` |
| `DBNOMOR` | `ALIAS` | `[ALIAS]` |
| `DBNOMOR` | `PEMISAH` | `[PEMISAH]` |
| `DBNOMOR` | `FORMAT1` | `[FORMAT1]` |
| `DBPERKIRAAN` | `Kelompok` | `[Kelompok]` |

```go
// ✅ CORRECT
tx.Raw("UPDATE DBNOMOR SET [FORMAT1] = [FORMAT1] + 1 WHERE [ALIAS] = ?", tipe)

// ❌ WRONG
tx.Raw("UPDATE DBNOMOR SET FORMAT1 = FORMAT1 + 1 WHERE ALIAS = ?", tipe)
```

### 4. UPDATE / Zeroing Columns

When resetting columns to zero/null (e.g., canceling authorization), use comma-separated `SET` clauses — no semicolons:

```go
// ✅ CORRECT
tx.Exec("UPDATE DBTRANS SET %s = 0, %s = '', %s = NULL WHERE [NoBukti] = ?",
    col, userCol, tglCol, noBukti)

// ❌ WRONG — trailing semicolon
tx.Exec("UPDATE DBTRANS SET IsOtorisasi1 = 0; WHERE [NoBukti] = ?", noBukti)
```

### 5. Date/Time Handling

Use parameterized queries only:
```go
// ✅ CORRECT
tx.Where("[Tanggal] >= ? AND [Tanggal] <= ?", start, end)

// ❌ WRONG — string concatenation
tx.Where(fmt.Sprintf("[Tanggal] = '%s'", dateStr))
```

### 6. String Operations

- `LIKE '%word%'` — no regex
- Concatenation uses `+` (not `CONCAT()`)
- `SUBSTRING(col, start, length)` — 1-indexed
- `UPPER(col)` / `LOWER(col)` — case conversion
- `LEN(col)` — length (not `LENGTH()`)

### 7. Pagination (No LIMIT/OFFSET)

SQL Server 2008 does NOT support `LIMIT`/`OFFSET`. Use:

**Option A — TOP-based:**
```go
tx.Raw("SELECT TOP ? * FROM DBTRANSAKSI WHERE [NoBukti] NOT IN (SELECT TOP ? [NoBukti] FROM DBTRANSAKSI ORDER BY [Tanggal] DESC) ORDER BY [Tanggal] DESC", limit, offset)
```

**Option B — CTE with ROW_NUMBER() (recommended):**
```go
tx.Raw(`
  WITH CTE AS (
    SELECT *, ROW_NUMBER() OVER (ORDER BY [Tanggal] DESC) AS RowNum
    FROM DBTRANSAKSI
  )
  SELECT * FROM CTE WHERE RowNum BETWEEN ? AND ?
`, startRow, endRow)
```

---



## Database Migrations (CRITICAL)

- **NEVER** use GORM `AutoMigrate` at runtime.
- **ALWAYS** use CLI flags:
  ```bash
  cd backend && go run cmd/main.go --migrate   # Apply schema changes
  cd backend && go run cmd/main.go --seed      # Seed initial data
  ```
- **Legacy tables** (from Laravel): Do NOT add `CreatedAt`/`UpdatedAt` or change primary keys.

---

## Quality Verification (USER-RUN ONLY)

> Per global RULES.md §2, **agents and skills MUST NOT execute any of these commands** — including `check-all.sh`, `go build`, `go test`, `npm run type-check`, `npm test`, `npx playwright test`, `swag init`, `npx @tanstack/router-cli generate`, `npm run dev`, `go run`. The user runs the quality gate and shares the output.

```bash
# User runs (the agent must NOT run these):
./scripts/check-all.sh               # All checks (backend + frontend)
./scripts/check-all.sh --backend-only
./scripts/check-all.sh --frontend-only

# Agent reads the batched output the user shared:
cat tmp/latest/*_errors.log
cat tmp/latest/check_report.md
```

---

## Server Startup

```bash
# Backend
cd backend && go run ./cmd/main.go

# Frontend
cd frontend && npm run dev
```

---

## Testing

```bash
# Backend
cd backend && go test ./... -v
cd backend && go test -coverprofile=coverage.out ./...

# Frontend
cd frontend && npm test -- --run          # Vitest unit tests
cd frontend && npx playwright test        # E2E tests
```

---

## Caching & Rate Limiting

| Endpoint Type | Cache? | TTL |
|---|---|---|
| Static data (`/menus/sidebar`, config, locales) | Yes | 1 hour |
| Heavy aggregate data (`/dashboard/stats`) | Yes | 5–10 min |
| Semi-static lists (`/users`, `/periode`) | Yes | 30s–1min |
| User profile (`/api/me`) | Yes (userId in key) | 5 min |
| Write ops (POST/PUT/DELETE) | **No** | — |
| Auth flows (`/auth/login`, `/auth/refresh`) | **No** | — |

Cache key format:
- Global: `cache:global:[feature]:[endpoint]`
- User-scoped: `cache:user:[userId]:[feature]:[endpoint]`

Rate limiter: Redis-backed Token Bucket (atomic Lua). Emit `X-RateLimit-Limit/Remaining/Reset`. Fail-open if Redis is down.

---

## Task Status Format

```
📋 TODO | ⏳ IN_PROGRESS - Month Day, Year | ✅ COMPLETED - Month Day, Year
❌ BLOCKED - Month Day, Year | 🔄 SUCCEEDED_BY: TASK-XXX - Month Day, Year
```

See `tasks/CLAUDE.md` for full task lifecycle documentation.

---

## Architecture Patterns (Summary)

### Backend
- Layered per domain: `handler.go` → `service.go` → `repository.go` → `entity.go`
- Handler MUST NOT call repository directly
- All API responses via `internal/shared/response/` helpers — never `c.JSON(...)` directly
- Response envelope: `{ "success": true, "status": 200, "message": "...", "data": {...} }`

### Frontend (TanStack Start)
- **Server functions** in `src/server/functions/` — `createServerFn` from `@tanstack/react-start`
- Cookie management: `setCookie`/`getCookie`/`deleteCookie` from `@tanstack/start-server-core`
- Server functions compile to ESM — always static `import`, never `require()`
- Backend calls: `makeBackendRequest()` from `src/server/backend.ts`
- Env vars: `getEnv()` / `parseEnvTime()` from `src/server/utils.ts`
- SSR hydration: Zustand persist uses `skipHydration: true`, rehydrate in `useEffect`
- Client-only pattern: `useState(false)` + `useEffect(() => setMounted(true))` for browser state
- All types in `src/types/` (prefix: `I` interface, `T` type, `P` props)
- No `axios`/`fetch` in components — use `src/services/` via TanStack Query hooks
- All errors through `src/utils/errorMapper.ts`
- All user-facing strings via `useTranslation()` — update `locales/en` AND `locales/id` together
- Response decode (dev logging): `fromCrossJSON` from `seroval` — no custom decoder needed

---

## Lessons Learned — Browse Autocomplete

> **Date:** 2026-07-12 · **Status:** Resolved (commit `a13c6a9`)
> **Symptom:** `Cannot read properties of undefined (reading 'spread')` on `KasBankFormDialog` Perkiraan autocomplete.

### TL;DR
Backend handlers returned mixed response envelopes (raw array vs wrapped `{success,status,message,data}`). The frontend service/hook/picker layer was typed for one shape but received the other, causing `Array.isArray` to fail silently and `...spread` of `undefined` to crash.

### Root Cause Chain
1. **`handler.go` used `c.JSON(http.StatusOK, results)`** — raw array, no envelope.
2. **`makeBackendRequest`** expects `{success, message, data}` and only unwraps when `success !== undefined`. Bare arrays slip through unchanged.
3. **`browseService.search`** typed as `Promise<IBrowseRow[]>` but received `{data: [...]}` → `Array.isArray` returned `false`.
4. **`useBrowseSearch`** and **`GenericBrowsePicker`** then spread an object literal → runtime crash.

### The Fix (one-shot pattern — apply to ALL list endpoints)
**Backend handler — always use `response.Success` / `response.Error`:**
```go
// ✅ Correct
c.JSON(http.StatusOK, response.Success(c, "Browse search results", results))
c.JSON(http.StatusInternalServerError, response.Error(c, 500, err.Error()))

// ❌ Wrong (envelope drift)
c.JSON(http.StatusOK, results)
c.JSON(http.StatusOK, gin.H{"results": results})
```

**Frontend service — defensive unwrap for both shapes:**
```ts
async search(params: IBrowseSearchParams): Promise<IBrowseRow[]> {
  const result = await searchBrowseFn({ data: { query: buildSearchQuery(params) } })
  // Belt-and-suspenders: handle raw array OR wrapper OR null
  if (Array.isArray(result)) return result
  return ((result as any)?.data as IBrowseRow[] | undefined) ?? []
}
```

**Frontend hooks/components — coerce to array BEFORE spread:**
```ts
// useBrowseSearch
const options: IBrowseRow[] = Array.isArray(query.data) ? query.data : []

// GenericBrowsePicker
const safeResults: IBrowseRow[] = Array.isArray(searchResults) ? searchResults : []
const items = [...safeResults]
```

### Files Touched (commit `a13c6a9`)
- `backend/internal/features/browse/handler.go` — all 5 endpoints normalized to `response.Success`
- `frontend/src/domains/browse/services/browseService.ts` — defensive unwraps in 5 methods
- `frontend/src/domains/browse/hooks/useBrowseSearch.ts` — `Array.isArray` coercion
- `frontend/src/domains/browse/components/browse/GenericBrowsePicker.tsx` — `safeResults` guard

### Detection Signals (if this EVER recurs)
1. Console error contains: `'undefined' is not iterable` / `Cannot read properties of undefined (reading 'spread')` / `map of undefined`
2. Network tab shows bare `[...]` array OR `{success: undefined, data: [...]}` from a Go handler
3. Autocomplete dropdown shows nothing OR label "undefined"

### Debug Procedure (5 minutes)
```bash
# 1. Hit endpoint directly with JWT
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"superadmin123"}' | jq -r '.data.access_token')

curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/browse/search?kodeBrowse=1001&q=test" | head -c 200

# 2. If response is bare array → handler missing response.Success wrapper
# 3. If response is {success:true, data:[...]} → FE service missing unwrap
# 4. If response is null/undefined → server function validator throwing
```

### Related Issues (not yet fixed but catalogued)
- **Browse 1001 (Perkiraan global):** `mssql: Incorrect syntax near ':'` — a browse config has legacy Delphi `<P:` placeholder that mssql can't parse. Affects only `kodeBrowse=1001`, not used by KasBank (we use 20011/1005).
- **NoBukti generation** depends on `dbNomor` config row — verify before relying on autonumber.

### Rule Going Forward
**Any new browse/list handler MUST use `response.Success(c, msg, data)`.** When reviewing PRs, reject any handler returning raw arrays or custom wrappers.

---

## Lessons Learned — Lookup Autocomplete (CustSupp)

> **Date:** 2026-07-23 · **Status:** Resolved
> **Symptom:** Dropdown item di `HutangPiutangSubForm` menampilkan literal `"undefined - undefined"` saat user membuka picker Customer/Supplier.

### TL;DR
Frontend `ICustSupp` interface menggunakan **lowercase fields** (`kode`, `nama`) sedangkan backend `SDBCUSTSUPP` mengembalikan **PascalCase camelized JSON** (`KodeCustSupp`, `NamaCustSupp`). Karena TypeScript `as ICustSupp[]` adalah runtime no-op assertion, field yang missing hanya jadi `undefined` — bukan type error. Template literal render `"undefined - undefined"` di dropdown.

### Root Cause Chain
1. **`backend/internal/features/accounting/kasbank/handler.go`** pakai `response.Success(c, "Success", res)` — envelope `{success, message, data: []}` ✓
2. **`serverFn` `lookupCustSupp`** extract `result.data` → raw array `SDBCUSTSUPP[]` (PascalCase) ✓
3. **`kasbankService.lookupCustSupp`** return `result as ICustSupp[]` ⚠ — shape array OK, tapi field names PascalCase
4. **`ICustSupp` interface** salah: `{ kode: string; nama: string }` (lowercase) — tidak match
5. **`HutangPiutangSubForm` line 58**: `label: \`${c.kode} - ${c.nama}\`` → literal `"undefined - undefined"`

### The Fix (surgical, 3 files)
**`types/kasbank.ts`** — interface match backend JSON:
```ts
export interface ICustSupp {
  KodeCustSupp: string;
  NamaCustSupp: string;
}
```

**`HutangPiutangSubForm.tsx`** — use PascalCase field accessors:
```tsx
const options = res.map((c) => ({
  label: `${c.KodeCustSupp} - ${c.NamaCustSupp}`,
  value: c.KodeCustSupp,
}))
```

**`kasbankService.lookupCustSupp`** — belt-and-suspenders defensive unwrap (same pattern as Browse):
```ts
if (Array.isArray(result)) return result as ICustSupp[]
return ((result as any)?.data as ICustSupp[] | undefined) ?? []
```

### Detection Signals (if this EVER recurs)
1. Dropdown/select items show literal `"undefined"` (atau `"- undefined"`, `"undefined - undefined"`)
2. Backend response Network tab JSON berisi PascalCase keys (`KodeCustSupp`)
3. TypeScript `as IFoo[]` cast di service layer (silencing runtime shape mismatch)

### Rule Going Forward (extended)
**Every new lookup/list endpoint that has a dedicated FE `IXxx` interface MUST:**
1. Backend handler returns `response.Success(c, msg, data)` (envelope)
2. FE interface field names = exact backend camelized JSON keys (case-sensitive)
3. FE service uses defensive unwrap: `Array.isArray(result) ? result : result?.data ?? []`

### Pattern Variant Map (rename field `f` in feature `X`)
| Endpoint | Interface | Component where it surfaced | Status |
|---|---|---|---|
| `/api/browse/search?kodeBrowse=...` | `IBrowseRow` | `GenericBrowsePicker` | Fixed (a13c6a9) |
| `/api/accounting/kasbank/lookup-custsupp` | `ICustSupp` | `HutangPiutangSubForm` | Fixed (this lesson) |
| `/api/accounting/kasbank/outstanding-hutpiut` | `IOutstandingHutPiut` | `HutangPiutangSubForm` invoices list | Defensive unwrap added (no shape drift, JSON tags match) |

When adding any new lookup endpoint → assume the same shape drift can occur → apply all 3 fixes proactively.

---

## Lessons Learned — Invalid Column Name (DBHUTPIUT Outstanding)

> **Date:** 2026-07-23 · **Status:** Resolved
> **Symptom:** Frontend dropdown "Tidak ada tagihan tertunda" displays even after user picks a CustSupp with open invoices. Network tab shows 500 error with `Invalid column name 'NoUrut'`.

### TL;DR
Backend `service.GetOutstandingHutPiut` SQL referenced `MAX(NoUrut)` but the DBHUTPIUT table has `NoUrutJurnal` (not `NoUrut`). SQL Server rejected the query with 500. Frontend `loadInvoices()` caught the error → setInvoices([]) → blank table with "Tidak ada tagihan tertunda".

### Root Cause
- `dbhutpiut.go:57` declares `NoUrutJurnal *string`
- `service.go:1779` (pre-fix) referenced `MAX(NoUrut) AS NoUrut` — wrong column name
- DBSPK has `NoUrut` (different table) → copy-paste confusion

### The Fix
**`backend/internal/features/accounting/kasbank/service.go:1779`**
```sql
MAX(NoUrutJurnal) AS NoUrutJurnal,
```

**`backend/internal/features/accounting/kasbank/subtrans_test.go:281,312,327,354,380,406,435`** — updated 7 sqlmock column lists from `"NoUrut"` to `"NoUrutJurnal"` so unit tests match the corrected query.

### Detection Signals (if this EVER recurs)
1. Frontend list endpoint returns empty (no rows, no error UI)
2. Network tab shows 500 response with `Invalid column name 'X'`
3. SQL `MAX(X)` / `SUM(X)` / `WHERE X` — `X` not in `models/dbx.go` struct

### Debug Procedure (5 minutes)
```bash
# 1. Find the actual model column name
grep -n "NoXxx" backend/internal/infrastructure/persistence/models/dbhutpiut.go

# 2. Find the SQL reference
grep -rn "NoXxx" backend/internal/features/

# 3. If SQL column != model column → fix SQL to match model
```

### Rule Going Forward
**Before adding `MAX(col)` / `SUM(col)` / `WHERE col` to any SQL query:**
1. Check `models/<table>.go` for exact column name (case-sensitive, PascalCase for legacy tables)
2. Don't copy-paste column names from other tables — verify in target model
3. Update both SQL and any test sqlmock column lists in the same commit

### Related Files (commit pending)
- `backend/internal/features/accounting/kasbank/service.go` — SQL column rename
- `backend/internal/features/accounting/kasbank/subtrans_test.go` — 7 sqlmock column lists updated

---

## Lessons Learned — Aktiva Sub-Form Delphi Parity

> **Date:** 2026-07-23 · **Status:** Resolved
> **Symptom:** React `AktivaSubForm.tsx` diverges sharply from Delphi `FrmSubAktiva.pas`:
> no `KodeAktiva` display, no auto-NoUrut, no validation, missing `% Pajak`, wrong
> lookup response shape, missing backend endpoints entirely.

### TL;DR
The component and its backend lookups had drifted in 3 directions:

1. **Routes were never registered** — `lookup-bagian`, `lookup-akumulasi-aktiva`,
   `lookup-biaya-aktiva`, `generate-no-urut-aktiva`, `generate-no-urut-aktiva2`
   were called from the FE but had no handlers → silent 404s → empty arrays.
2. **Defensive unwraps were inverted** — FE stored `(result as any[])[0]` on a
   wrapped `{success, message, data}` object, returning `undefined` and never
   triggering the `alert("Tidak ditemukan!")` branch.
3. **Form behaviour was a thin shell** — the user had to type a 5-digit number
   manually, no KodeAktiva preview, no save-time validation, no `% Pajak` field.

### The Fix (one-shot, 8 files)
**Backend** — register the missing endpoints:
- `repo.LookupBagian`, `repo.LookupAkumulasiAktiva`, `repo.LookupBiayaAktiva`,
  `repo.GenerateNoUrutAktiva`, `repo.GenerateNoUrutAktiva2` — SQL Server 2008 R2-
  compatible, `response.Success` envelopes only.
- `service.*` thin pass-through; `handler.*` with godoc; `routes.go` new entries
  under `PermHasAccess`.

**Frontend types** — extend `IAktiva` with `persenpajak: number` (Delphi
`PersenPajak`).

**Frontend service** — replace brittle `(result as any[])[0]` with the
browse/custsupp pattern:
```ts
const rows = Array.isArray(result) ? result : (result as any)?.data ?? []
return rows[0] ?? null
```

**AktivaSubForm.tsx** — full rewrite to match Delphi:
- `useMemo` to derive `kodeAktiva` from `Perkiraan.NoUrut[.NoUrut2]`
  (mirrors `NourutChange` / `isHeaderExit`).
- `useEffect` to trigger `generateNoUrutAktiva` once both Perkiraan and Devisi
  are present (mirrors `UrutAktiva`).
- Field-level description labels for ALL 7 lookup fields (Perkiraan, Devisi,
  Bagian, Akumulasi, Biaya, Biaya2, Biaya3).
- `Biaya 2 / 3` empty-sentinel `'-'` zeroes the matching `PersenSusut` (Delphi
  `BiayaSusut2Exit` / `BiayaSusut3Exit`).
- Conditional `% Pajak` input (renders only when `metode === 'P'`).
- `<Textarea>` for Keterangan (was `<Input>`) — Delphi `TMemo`.
- Full `BitBtn3Click` validation:
  - `PersenBiaya1 + PersenBiaya2 + PersenBiaya3 == 100`
  - `% Susut != 0`, Metode/Akumulasi/Biaya required
  - `PersenBiaya1 != 0`
  - `NoUrut` / `NoUrut2` >= 5 chars

### Detection Signals (if this EVER recurs)
1. Network tab shows 404 on `/api/accounting/kasbank/lookup-*` after a user
   types an Enter-key code.
2. Form auto-populates `NoUrut` but `Kode Aktiva (otomatis)` stays empty.
3. Save alert: `"undefined is not iterable"` (the old `(result as any[])[0]`
   bug, if the defensive unwrap is ever removed).

### Rule Going Forward (extended)
**Every Delphi sub-form** (Aktiva, Giro, Deposito, HutangPiutang) MUST have:
1. A read-only derived `KodeAktiva`-style display field when the form builds a
   composite code.
2. An auto-generated sequence that mirrors Delphi `UrutXxx(...)` (server-side
   `COUNT+1`).
3. Full `BitBtn3Click`-equivalent validation on the save handler.
4. All lookup helpers use `Array.isArray(result) ? result : (result as any)?.data ?? []` —
   never direct array indexing of a wrapped envelope.
5. Every lookup endpoint registered in `routes.go` before the FE can call it.

### Pattern Variant Map (this lesson)
| Endpoint | Interface | Component where it surfaced | Status |
|---|---|---|---|
| `/api/accounting/kasbank/lookup-bagian` | (`any`) | `AktivaSubForm` Bagian | Fixed (this lesson) |
| `/api/accounting/kasbank/lookup-akumulasi-aktiva` | `SDbPerkiraan` | `AktivaSubForm` Akumulasi | Fixed (this lesson) |
| `/api/accounting/kasbank/lookup-biaya-aktiva` | `SDbPerkiraan` (Tipe=1) | `AktivaSubForm` Biaya 1/2/3 | Fixed (this lesson) |
| `/api/accounting/kasbank/generate-no-urut-aktiva` | `gin.H{nourut: string}` | `AktivaSubForm` NoUrut auto-fill | Fixed (this lesson) |
| `/api/accounting/kasbank/generate-no-urut-aktiva2` | `gin.H{nourut2: string}` | `AktivaSubForm` NoUrut2 auto-fill | Fixed (this lesson) |

---

## Slash Commands

- `/architect TASK-XXX` — Orchestrate full feature (backend → frontend → QA). The orchestrator only **reviews** artifacts the user ran; it never executes `check-all.sh` itself.
