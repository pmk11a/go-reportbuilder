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
