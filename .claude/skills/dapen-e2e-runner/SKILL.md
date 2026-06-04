---
name: dapen-e2e-runner
description: Executes Playwright E2E tests for the DAPEN project and verifies coverage. Use this skill when the user asks to "run E2E", "check coverage", "verify Login flow", or "test the full stack end-to-end". Always confirms the backend + frontend dev servers are up before running.
---

# DAPEN E2E Runner

This skill runs the End-to-End tests in the DAPEN repository using **Playwright** (frontend) and **httptest** (backend) and reports coverage.

## Prerequisites — confirm BEFORE running tests

1. **Backend running** on `http://localhost:8080`:
   ```bash
   cd backend && go run ./cmd/main.go
   ```
   (Or `make -C backend dev` for hot-reload via Air.)
2. **Frontend dev server running** on `http://localhost:3000`:
   ```bash
   cd frontend && npm run dev
   ```
3. **Playwright installed** in `frontend/`:
   ```bash
   cd frontend && npx playwright install
   ```

If any prerequisite is missing, **stop and ask the user to start it** — do not start servers yourself in the user's terminal.

## Execution

Inside the `frontend/` directory:

```bash
# Run all E2E specs headless
npx playwright test

# UI mode (for debugging a single failing test)
npx playwright test --ui

# A specific spec file
npx playwright test e2e/auth/login.spec.ts

# A specific test by title
npx playwright test -g "user can log in with valid credentials"
```

For backend E2E (`backend/tests/e2e/`), use the standard Go test runner:

```bash
cd backend && go test ./tests/e2e/... -v
```

## Coverage Requirement

The QA agent (`@dapen-qa`) must ensure critical flows (Auth, Transactions, Setup Periode) maintain **≥90% pass rate** on the affected specs. For backend, `coverage_tested` ≥80% is enforced by `./scripts/check-all.sh`.

On failure, read:
- `frontend/playwright-report/` — the HTML report with traces.
- The trace file for the failing test (Playwright shows the path in the run output).

Then either:
- If the bug is in the test, fix the test.
- If the bug is in the source, route the finding to `@dapen-frontend` (UI) or `@dapen-backend` (API).

## Known Gotchas

- **Translations / i18n**: DAPEN uses `react-i18next` with `id` and `en` locales. Tests must select by `aria-label` or role, **never** by hardcoded text — the same selector must work in both languages.
- **Loading States**: The app uses `<Skeleton />` (for layouts) and rotating `<Loader2 />` (inside submit buttons). Tests must wait for these to disappear (or use `waitFor` on the actual content) **before** interacting.
- **BFF / HttpOnly cookies**: The BFF (`src/api-handlers/`) holds JWT in HttpOnly cookies server-side. Tests run in a real browser, so this is transparent — but be aware that `localStorage` / `document.cookie` will not see the token.
- **CSRF**: BFF issues a CSRF token. Tests that POST via the BFF need to fetch the token first; tests that hit the backend directly bypass it.
- **TanStack Router generated tree**: `frontend/src/routeTree.gen.ts` is auto-generated. After adding/removing files in `src/routes/`, run `npx @tanstack/router-cli generate` BEFORE running E2E.
- **Mocking network in tests**: Do not use `page.route()` to mock the BFF or backend. The project explicitly requires real API integration (rule #8 / rule #11 in root `AI.md`).

## Report

After running, summarize:
- Total specs / passed / failed.
- Wall-clock time.
- Top 5 failures with file path + error message + first 5 lines of the trace.
- Coverage (`coverage_all`, `coverage_tested` from `check-all.sh`).
- Recommended next step: fix-list or sign-off.
