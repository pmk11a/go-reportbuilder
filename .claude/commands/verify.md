---
name: verify
description: Run the full DAPEN quality gate — ./scripts/check-all.sh — and produce a grouped, prioritized error report from tmp/latest/. Use this when the user asks to "verify", "check everything", "are we green?", or "run all checks".
---

# /verify — Quality Gate Runner

Run the project's canonical quality gate and report a **batched, grouped summary** of what passed, what failed, and where to start fixing.

## Step 1 — Pick the scope

If the user passed a flag (`/verify --backend-only`, `/verify --frontend-only`, or `/verify --clean`), use it. Otherwise run the full sweep:

```bash
./scripts/check-all.sh
```

Flags supported by the script:
- `--backend-only` — only Go build/vet/test/coverage.
- `--frontend-only` — only type-check/build/test/lint.
- `--clean` — wipe `tmp/runs/` and `tmp/latest/` first.

The script isolates each run to `tmp/runs/<timestamp>/` and updates the `tmp/latest/` symlink. **Never** run individual checks (`go build`, `npm run type-check`, `npx playwright test`, etc.) directly — that's the fix-loop anti-pattern banned by rule #16 in `AI.md`.

## Step 2 — Wait for the run to finish
The script can take several minutes (frontend build + tests are the longest). Do not interleave other commands while it runs.

## Step 3 — Read the batched output

In this order:
1. `tmp/latest/summary.txt` — one-line per check, pass/fail, coverage numbers.
2. `tmp/latest/check_report.md` — markdown summary table.
3. `tmp/latest/*_errors.log` — only failed checks have content. Each file corresponds to one check (`backend_build_errors.log`, `frontend_type_check_errors.log`, etc.).
4. `tmp/latest/*_warnings.log` — warnings (deprecations, lint, suggestions).
5. `tmp/latest/backend_coverage.out` — Go coverage profile. For a per-function view: `go tool cover -func=tmp/latest/backend_coverage.out`.

## Step 4 — Build the report

Produce a concise report with these sections:

### Verdict
- ✅ **GREEN** if `check-all.sh` exited 0 and all coverage thresholds met.
- ❌ **RED** otherwise. List the failed checks by name.

### Numbers
- Total checks run, passed, failed.
- Backend: `coverage_all` and `coverage_tested` (the 80% threshold is on `coverage_tested`).
- Frontend: test pass/fail counts (if Vitest output is in the summary).

### Top errors (grouped by file)
For each failing check:
- File path with the highest error count.
- First 5 error lines per file.
- Suggested fix order:
  1. **Build / type-check / vet** errors (must clear first).
  2. **Unit test failures** (group by `_test.go` / `.test.tsx`).
  3. **Coverage gaps** (only when `coverage_tested` < 80% on tested packages).
  4. **Lint warnings** (often stylistic — fix last).
  5. **Build / runtime warnings** (informational; surface but don't block).

### Next step
A one-line recommendation, e.g. "Fix `backend/internal/handlers/user_handler.go:42` first — 3 build errors block 12 downstream test failures."

## Step 5 — Optional follow-up
If the user wants to go straight to fixing, hand the report to the relevant subagent (`@dapen-backend` for `backend/**` errors, `@dapen-frontend` for `frontend/**` errors, `@dapen-qa` for test/coverage issues) and iterate.

## Notes
- **BATCH only.** Never run individual checks in a loop.
- If the user said "verify everything" with no flag, run the full sweep.
- If the script reports a hung process (`vitest` workers, `esbuild` not exiting), the trap inside the script already cleans them up — no manual kill needed.
