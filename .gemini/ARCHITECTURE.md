# DAPEN Master Architecture & Code Patterns

This document is the main *Source of Truth* for all design patterns, coding rules, and architecture for the DAPEN project (*Golang Backend* & *React Frontend*).
This document must be referenced before writing any code, both by AI Agents and human developers. All documentation must be written in English by default.

---

## 1. Backend Architecture (Layered Clean Architecture)

This backend uses **Go** and the **Gin** framework, strictly structured based on the Layered *Clean Architecture* principle, without using *Feature Slices*.

### Core Layers Structure
1. **`internal/models` (Domain Layer)**: Contains pure database table structures (*structs*). **ABSOLUTE RULE**: Database model structs MUST NOT reside inside Handlers or Services.
2. **`internal/dto` (Data Transfer Objects)**: All JSON HTTP structures (Request/Response payloads) must be centralized here. Do not declare request/response structs in Handler files.
3. **`internal/repositories` (Data Layer)**: Interaction with the SQL Server database via **GORM**. Must define *interfaces* (e.g., `type IUserRepository interface`).
4. **`internal/services` (Business Logic)**: Holds all business rules. Injected with Repository interfaces.
5. **`internal/handlers` (Delivery Layer)**: Parses *requests*, reads URL parameters/JSON bodies, calls Services, and wraps the result into an *HTTP Response*.
6. **`internal/routes`**: URL Endpoint Registration (Prefix, Grouping, Middlewares).

### Essential Backend Guidelines
- **Dependency Injection**: Use constructor-based injection (Handler < Service < Repository).
- **Naming Conventions (Strict)**:
  - *Interfaces*: Must start with the letter `I` (e.g., `IUserService`).
  - *Structs*: Must start with the letter `S` (e.g., `SUser`, `SAuthHandler`).
  - *GORM*: Database structs named `SModel` MUST implement `TableName() string` to ensure safe database queries, preventing automatic pluralization.
- **Standard API Response**: All JSON outputs must go through the enterprise envelope `{ "success", "status", "message", "data" }` (use `utils.Success` or `utils.Error`).
- **Security**:
  - Use `AuthMiddleware` for JWT validation.
  - Apply dual-layer *Token Bucket* rate limiter (Global & Per-IP) and *Timeout Middleware*.
  - Disable proxy IP warnings via `engine.SetTrustedProxies(nil)`.
- **Database & Migrations (GORM)**:
  - GORM migrations are not executed during normal app startup, but invoked via `go run cmd/main.go --migrate`.
  - Avoid `AutoMigrate` on legacy Laravel built-in tables (e.g., `DBCUSTSUPP`). Do not arbitrarily add `CreatedAt`/`UpdatedAt` columns to legacy tables.
  - Provide sizes for *string* indexes (`size:100`) to prevent MSSQL issues.
- **Testing**:
  - `services/` and `handlers/` **must** have *Unit Tests*. Use Mocking for repositories.
  - GORM database query testing is done at the *Integration Test* layer, not *Unit Tests*.

---

## 2. Frontend Architecture (Strict Separation of Concerns)

The React (Vite) frontend utilizes **TanStack Router**, **TanStack Query**, and **Zustand**. There are strict Separation of Concerns (SoC) rules so that UI, *Fetching*, *State*, and Data Types are never mixed.

### Strict Frontend Rules (CRITICAL RULES)
1. **Centralized Data Types (Types)**
   All `interfaces` and `types` MUST reside in the `src/types/` folder (e.g., `components.ts`, `domain.ts`).
   *Naming Conventions*: `I` for Interfaces (`IUser`), `T` for Types (`TTheme`), `P` for Component Props (`PMenuFormDialog`). **Using `any` is forbidden.**
2. **No Fetching in Components**
   Calling `axios`/`fetch` is STRICTLY FORBIDDEN directly in `components/`. All network I/O is written in functions inside `src/services/` and then wrapped by TanStack Query Hooks (`src/hooks/`).
3. **Error Mapping Separation**
   It is forbidden to format errors in UI components. All errors are thrown to `src/utils/errorMapper.ts` which combines API error types with i18n into a 3-part structure (What, Why, Next Steps).
4. **BFF (Backend for Frontend)**
   `src/api-handlers/` controls APIs passing through local Next/Node API routes to secure JWT Tokens in *HttpOnly Cookies* and log *requests*. Must use `BffResponseBuilder`.
5. **Multi-Language (i18n)**
   Hardcoding strings is strictly forbidden! All UI text, *placeholders*, and validation *errors* must call `useTranslation()` (centralized in `src/locales/id` and `en`). English is the default language.

### Theme, Styles & Components (Aesthetics)
- **Glassmorphism & Unified Background**: All components (*Cards*, *Tables*, *Modals*) must have a translucent effect (Light: `bg-white/80`, Dark: `bg-slate-900/60`, blur: `backdrop-blur-xl`) with a consistent `AppBackground` application background.
- **Atomic Design & Reusability**: Before creating a new button/input, always check `/components/ui/`.
- **Loading & Skeleton**: Flat loading text is forbidden. Must use `<Skeleton />` components (for layouts) and a rotating `<Loader2 />` element inside buttons during *submits*.
- **SEO & A11y**: Must use `<Helmet>` from `react-helmet-async` for `title` & `meta`. Ensure `aria-label` is present on all elements without visual text.
- **Semantic Color Theme**: Use `bg-primary`, `text-secondary-600` etc. Do not use raw HEX codes in JSX.

### Role-Based Navigation
Path prefixes are clearly separated: `/admin` and `/karyawan`.
TanStack Router uses the `beforeLoad` route to enforce access rights (Guards).

---

## 3. Automation & Quality Gates

**Mandatory Tests**:
- **Backend**: *Services* (logic), *Handlers* (request parsing), *Middlewares*.
- **Frontend**: *Hook* & *Services* logic, Complex interactive forms, and business flows.
- **End-to-End**: E2E testing for *Core Workflows* (like Login) using **Playwright**.

Every agent must run *Testing* or *Build Checks* after modifications. At the end of a refactor, the application **MUST run without compilation errors**, and pass typing checks (TypeScript) as well as Formatting (Go).
