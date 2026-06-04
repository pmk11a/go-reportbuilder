# API Handlers & Hooks Context

## Responsibilities
- Wrap raw `services` functions with **TanStack Query** (React Query) hooks or custom React hooks.
- Manage caching, re-fetching, and optimistic updates.
- Centralize API state management for React components.

## Rules
- **Naming Convention:** Use `useGet[Entity]`, `useCreate[Entity]`, `useUpdate[Entity]`, etc.
- **UI Side-Effects:** This is the appropriate place to trigger success/error toasts on mutation success or failure using `useToast`.
- **Invalidation:** Always invalidate relevant query keys in `onSuccess` of mutations to ensure the UI stays fresh.
- **Separation:** Do not write raw Axios `GET`/`POST` commands here; always call functions from the `src/services` folder.

## Per-tab permission endpoints (TASK-009)
- `admin/users/permissions/menu.ts`, `.../report.ts`, `.../coa.ts` proxy
  the new backend endpoints. Each expects `?id=<userID>` and forwards to
  `/api/admin/users/{id}/permissions/{tab}`.
- The legacy combined `admin/users/permissions.ts` route is kept for the
  unchanged `PUT` (single transaction) and any callers still using the
  combined `GET`.

## Binary proxy (TASK-009)
- `admin/reports/permission-report.ts` proxies the matrix endpoint.
  For `format=json` it returns the standard `BffResponseBuilder` envelope;
  for `format=xlsx` / `format=pdf` it relays the upstream stream and
  headers unchanged. To make this work, the BFF dispatcher
  (`src/bff/dispatcher.ts`) now branches on `Content-Type` — non-text
  responses are sent as a Node `Buffer` instead of being decoded with
  `await response.text()`. Use `makeBackendRequestRaw` from
  `src/bff/utils.ts` whenever your handler needs the raw upstream
  `Response`.
