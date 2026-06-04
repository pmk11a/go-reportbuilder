# Components Layer Context

## Responsibilities
- Provide reusable, stateless UI elements across the application.
- Encapsulate layout, styling, and basic interactive behavior.
- Use local design system components (derived from Shadcn UI or custom).

## Rules
- **No Direct API Calls:** Components should not fetch data directly. Data should be passed down as props or fetched via custom hooks (TanStack Query) at the page/route level.
- **NO Glassmorphism:** Do NOT use glassmorphism effects (`backdrop-blur`, heavily transparent backgrounds). Follow standard component theme configurations (e.g., standard Shadcn UI styling).
- **Form Pattern:** ALL forms MUST use a form controller (e.g. `react-hook-form` + `zod` via `<Form>`, `<FormField>`) like the login page. Do NOT use plain `useState` for complex forms.
- **Modals & Overlays:** For modals, use the global Zustand modal store (`src/store/modalStore.ts`) to manage open/close states instead of local `useState` if it's accessed from different places (like the sidebar).
- **Separation of Concerns:** Keep components small. If a component grows past 200 lines, consider breaking it down into sub-components.

## Permission Report components (TASK-009)
- Folder: `src/components/admin/reports/permission-report/`
- Three siblings + barrel `index.ts`:
  - `PermissionReportFilters` — user / menu / menu-type controls.
  - `PermissionReportTable` — matrix rendered with `<Each>` rows and
    `<Show>`-gated ✓ / ✗ cells. Horizontally scrollable.
  - `PermissionReportActions` — Print / Export Excel / Export PDF
    buttons. Each export button shows `<Loader2 />` while its mutation
    is pending; the export buttons are disabled until a filter is
    applied.
- The page wires them together at `src/routes/admin/_layout/reports/permission-report/index.tsx`.

## UserPermissionsDialog refactor (TASK-009)
- Now consumes 3 per-tab hooks (`useUserMenuPermissions`,
  `useUserReportPermissions`, `useUserCoaAccess`) gated by `activeTab`.
  Each tab shows its own `<Skeleton />` placeholder while loading.
- The Read column writes to `checked` (legacy visibility flag) via
  `handlePermissionCheckbox`, NOT to `is_create` — see the dedicated
  Vitest at `UserPermissionsDialog.test.tsx` for the regression check.
