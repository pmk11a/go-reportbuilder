# Services Layer Context

## Responsibilities
- Pure TypeScript layer for making HTTP requests to the backend API.
- Manage Axios instances, endpoint definitions, and payload formatting.
- Handle raw API responses and type mappings.

## Rules
- **No React Code:** Do NOT use React hooks (`useState`, `useEffect`, etc.) in this directory. 
- **Return Types:** Every function must have explicit request and response TypeScript interfaces defined in `src/types` or `src/schemas`.
- **Error Handling:** Standardize error formatting before passing it up to the hooks/api-handlers. Do not trigger UI toast notifications directly from here.
- **Testability:** Each service should have an accompanying `.test.ts` file mocking the Axios/fetch calls.

## Permission services (TASK-009)
- `userService` exposes 3 split getters: `getUserMenuPermissions(id)`,
  `getUserReportPermissions(id)`, `getUserCoaAccess(id)` (in addition to
  the legacy combined `getPermissions(id)`). They map to the
  `/admin/users/permissions/{menu|report|coa}?id={id}` BFF endpoints.
- `permissionReportService` (new) handles the matrix endpoint and the
  binary Excel / PDF downloads. `downloadExcel` / `downloadPDF` return a
  `Blob`; the caller is responsible for triggering the actual file save
  (e.g. via `URL.createObjectURL`). Binary calls bypass `fetchHelper`
  because it always parses JSON.
