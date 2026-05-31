# Store Layer Context

## Responsibilities
- Manage global frontend state using **Zustand**.
- Handle UI state (modals, sidebars, themes) and global client data (user profile, authentication tokens, menu structures).

## Rules
- **No Server State:** Do NOT use Zustand to cache API responses that require frequent invalidation or polling. Use TanStack Query (in `api-handlers` or `hooks`) for server state.
- **Selectors:** Always expose state using selectors or encourage consumers to use selectors to prevent unnecessary re-renders.
- **Persist:** Be mindful of using Zustand's `persist` middleware. Only persist data that actually needs to survive page reloads (like theme, auth token, layout preferences). Do not persist sensitive PII unnecessarily.
