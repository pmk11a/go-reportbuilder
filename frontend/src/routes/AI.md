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
