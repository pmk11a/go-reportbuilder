---
name: dapen-build-check
description: Checks the build health and type safety of the DAPEN project. Use this skill after making significant architectural changes, before any fix-loop, or when the user asks "check build", "are there errors", "type-check", or "lint". Wraps ./scripts/check-all.sh and groups the resulting errors by file.
---

# DAPEN Build Check

This skill runs a full diagnostic on the DAPEN repository and returns a **batched, grouped error report** so you can fix everything in one pass — never in a fix-loop.

## When to use
- After significant architectural changes (new layers, new routes, new components).
- Before any individual check / fix / recheck cycle (RULE #16 in root `AI.md`).
- When the user asks: "check build", "any errors?", "type-check", "lint", "are tests passing?".
- When you're about to mark a task `✅ COMPLETED`.

## How it works

The project ships a single canonical orchestrator — `./scripts/check-all.sh` — that runs **all** backend + frontend checks and dumps logs into `tmp/runs/<timestamp>/` (with a `tmp/latest` symlink). **Always prefer this script** over running individual tools.

## Steps

1. **Pick a scope**:
   - If the recent edits were backend-only, run `./scripts/check-all.sh --backend-only`.
   - If frontend-only, run `./scripts/check-all.sh --frontend-only`.
   - Otherwise, run `./scripts/check-all.sh` (full sweep).
   - If you want a clean log dir, prepend `--clean`.

2. **Read the batched output** (in this order):
   - `tmp/latest/summary.txt` — pass/fail per check + coverage numbers.
   - `tmp/latest/check_report.md` — markdown summary.
   - `tmp/latest/*_errors.log` — per-check error files (only failures have content).
   - `tmp/latest/*_warnings.log` — per-check warning files.
   - `tmp/latest/backend_coverage.out` — Go coverage profile (run `go tool cover -func=tmp/latest/backend_coverage.out` for a per-function report).

3. **Group errors by file path** (use a table or bullet list):
   - For each file with errors, list the first ~5 lines from the log.
   - Note the error category: `build`, `vet`, `test`, `coverage gap`, `type-check`, `lint`, `unit test fail`.
   - For Go errors, also note the package.

4. **Suggest a fix order**:
   1. **Build errors** (compile-fail, syntax) — must clear first or nothing else is meaningful.
   2. **Type-check / vet errors** — same rationale.
   3. **Unit test failures** — group by `_test.go` or `.test.tsx` file.
   4. **Coverage gaps** — flagged when `coverage_tested` < 80% on tested packages.
   5. **Lint warnings** — fix last, often stylistic.
   6. **Warnings** — informational; surface but don't block.

5. **Report** to the user with:
   - Total checks / passed / failed.
   - Coverage (`coverage_all` and `coverage_tested`) if backend ran.
   - Top 5–10 errors, each with file:line and the first error line.
   - Recommended fix order.

## Reference: Backend individual checks (use only when `check-all.sh` is unavailable)

Inside `backend/`:
```bash
go build -v ./...
go vet ./...
go test -coverprofile=coverage.out ./... -count=1
go tool cover -func=coverage.out
```

## Reference: Frontend individual checks (use only when `check-all.sh` is unavailable)

Inside `frontend/`:
```bash
npx @tanstack/router-cli generate   # if src/routes/ changed
npm run type-check
npm run build
npm test -- --run
npm run lint                         # if a lint script exists
```

## Notes
- **Always** batch-collect first (RULE #16). Never run `go build`, see one error, fix, re-run, see the next, fix, re-run.
- For per-layer feature context, also read the relevant `CLAUDE.md` in `backend/internal/<layer>/` or `frontend/src/<area>/`.
- Coverage threshold of 80% applies to **tested packages** (`coverage_tested`), not all packages — the script averages only packages that have non-zero coverage. New code you add is expected to bring the tested average up.
