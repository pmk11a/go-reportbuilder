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
