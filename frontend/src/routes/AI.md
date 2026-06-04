# Routes Layer Context

## Responsibilities
- Define the URL structure and routing using **TanStack Router**.
- Serve as the "Pages" or "Views" that assemble multiple components.
- Handle URL search parameters, path parameters, and navigation guards.

## Rules
- **File-based Routing:** Follow TanStack Router conventions for file naming (`_layout.tsx`, `index.tsx`, etc.).
- **Data Fetching:** This is the appropriate place to invoke React Query hooks (`useQuery`, `useMutation`) from `api-handlers` or `hooks` to load data for the view.
- **Access Control:** Handle role-based access control or redirects (e.g., in `beforeLoad` or `loader` functions of the route definitions).
- **Keep it Clean:** Avoid writing deep UI logic here. Route files should primarily handle data loading, layout assembly, and state passing.

## New routes (TASK-009)
- `admin/_layout/reports/index.tsx` — list of available reports (now a
  Shadcn card grid; was a placeholder). Each card is a `<Link>` to the
  matching report page.
- `admin/_layout/reports/permission-report/index.tsx` — the Permission
  Report page. Owns the draft / applied filter state, calls
  `usePermissionReportMatrix`, and renders the three permission-report
  sub-components from `src/components/admin/reports/permission-report/`.
  Imports `src/styles/print.css` as a side-effect import so
  `window.print()` produces the landscape, header-repeating layout
  defined there.

Both new routes use `<Helmet>` for `title` + `description` and rely on
`MainHeader` to render the page header (no per-page `<h1>`).
