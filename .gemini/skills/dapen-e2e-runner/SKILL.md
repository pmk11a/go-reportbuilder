---
name: dapen-e2e-runner
description: "Executes Playwright E2E tests for the DAPEN project and verifies > 90% coverage. Use this skill when the user asks to run E2E tests, check frontend coverage, or verify core flows like Login/Register."
---

# DAPEN E2E Runner

This skill executes End-to-End tests in the DAPEN repository using Playwright.

## Prerequisites
Before running tests, you MUST ensure that:
1. The backend server is running (usually `go run ./cmd/main.go` in `backend/`).
2. The frontend dev server is running (usually `npm run dev` in `frontend/`).
3. Playwright is installed in `frontend/` (`npx playwright install`).

## Execution
Run the following command inside the `frontend/` directory to execute tests:
```bash
npx playwright test
```

To run with UI mode (for debugging):
```bash
npx playwright test --ui
```

## Coverage Requirement (90%)
The QA Agent must ensure that critical flows (Auth, Transactions) maintain a 90% coverage rate.
If a test fails, you must read the playwright report generated in `frontend/playwright-report/` or read the trace file to understand the failure and fix the UI/Backend accordingly.

## Known Gotchas
- **Translations**: DAPEN uses `react-i18next`. Tests must select elements by `aria-label` or role, avoiding hardcoded text which might change based on the active language (`id` vs `en`).
- **Loading States**: The application uses `<Skeleton>` and `Loader2`. Tests must wait for these elements to disappear or wait for the actual content to become visible before interacting.
