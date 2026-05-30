# GEMINI.md - Engineering Handbook & Context

This document serves as the foundational mandate for all AI interactions within this project. It defines the architecture, design standards, and development workflows to ensure consistency and technical integrity.

---

## 🚀 Project Overview

**golang-next** is a high-performance full-stack application featuring a Go-powered backend and a modern React frontend.

- **Backend**: Go (Gin Framework), MongoDB, JWT Authentication.
- **Frontend**: React (Vite), TypeScript, TanStack Router (File-based), TanStack Query, Zustand, Tailwind CSS v4.
- **Design System**: Custom premium UI library built with Radix UI primitives and Tailwind v4.

---

## 📚 Required Reading (EVERY COMMAND)

Before executing ANY command from the user, you MUST:

1. **Read the relevant guides for the current scope:**
   - If working on frontend: Read `/frontend/CODE_GUIDE.md` and `/frontend/ARCHITECTURE.md`
   - If working on backend: Read `/backend/CODE_GUIDE.md` and `/backend/ARCHITECTURE.md`
   - If unsure: Read them all

---

## 🎨 Theme & Design Mandates (CRITICAL)

All new components and pages **MUST** adhere to these visual standards.

### 1. Color System (Semantic)
Do not use hardcoded hex/rgb values. Use the semantic mapping defined in `frontend/src/styles/globals.css`:
- **Primary**: Sky/Blue (`bg-primary`, `primary-600`).
- **Secondary**: Teal/Amber (`secondary-600`).
- **Accent**: Purple/Indigo (`accent-500`).
- **Muted**: `slate-100` (Light) / `slate-800` (Dark).
- **Surface**: `bg-white` (Light) / `bg-slate-900` (Dark).

### 2. Geometry & Spacing
- **Inputs, Buttons, Tabs, Tags**: `rounded-xl` (12px).
- **Cards, Modals, Popovers, Sheets**: `rounded-2xl` (16px).
- **Shadows**: Use `shadow-sm` for small elements, `shadow-xl` or `shadow-2xl` for overlays.

### 3. Consistency
- Always check the interactive documentation at `/docs` before creating new UI patterns.
- Ensure every component supports **Dark Mode** using the `dark:` prefix.

---

## 🏗️ Project Structure

### Backend (`/backend`)
- `cmd/main.go`: Entry point & server initialization.
- `internal/handlers`: HTTP controllers (feature-based).
- `internal/services`: Business logic layer.
- `internal/repositories`: Data access layer (MongoDB).
- `internal/models`: BSON/JSON data structures.

### Frontend (`/frontend`)
- `src/routes`: TanStack Router (File-based routing).
  - `(admin)`: Protected administration pages.
  - `(public)/docs`: Categorized documentation hub.
- `src/components/ui`: Reusable UI atoms (Form, Overlay, Feedback, etc.).
- `src/store`: Zustand state management (`themeStore`, `authStore`).
- `src/styles/globals.css`: The "Source of Truth" for the theme system.

---

## ⚡ Development Workflows

### Building & Running
- **Backend**: `cd backend && go run ./cmd/main.go`
- **Frontend**: `cd frontend && npm run dev`
- **Router Sync**: `npx @tanstack/router-cli generate` (Required after adding files to `src/routes`).

### Coding Standards
- **Routing**: Use `Link` from `@tanstack/react-router` for all internal navigation.
- **Theme Access**: Use `useTheme()` hook from `@/store/themeStore` for JS-side theme checks.
- **API Calls**: Use the `apiClient` pattern defined in `frontend/src/lib/api.ts`.
- **Validation**: Use `zod` for schemas and `react-hook-form` for form state.
- **Localization (i18n)**: All user-facing strings MUST use `react-i18next` (`useTranslation`). Do not use hardcoded Indonesian or English text in `.tsx` files. Use `en/common.json` and `id/common.json` dictionaries.
- **Error Handling**: API Errors MUST be processed via `src/utils/errorMapper.ts` which integrates with i18n to provide standard 3-part messages (What failed, Why it failed, Next steps). Do not format errors directly in components or `api.ts`.

---

## 🛠️ Key Commands Reference
- `npm run type-check`: Run full TypeScript diagnostics.
- `npm run lint`: Check for linting errors.
- `go fmt ./...`: Format Go source code.

**Status:** Active Development
**Version:** 1.0.0
