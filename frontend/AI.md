# AI.md - Frontend Quick Reference

> **Global Rule**: Always refer to `../.gemini/ARCHITECTURE.md` for major architectural patterns.

## 🎯 Frontend Focus (React, Vite, Tailwind v4)

The `frontend/` workspace completely separates UI, Data, and Logic.
The primary work in this area is always assigned to: **`@dapen-frontend`**

### 📋 Mandatory Frontend Checklist
- [ ] Components use libraries from `src/components/ui` if they already exist.
- [ ] Use designs with translucent effects (Glassmorphism): `bg-white/80 backdrop-blur-xl`.
- [ ] No static data types inside components. Use types from `src/types/`.
- [ ] No network calls (`axios`/`fetch`) in components. Use `src/services/`.
- [ ] Errors are not formatted in components; they must pass through `src/utils/errorMapper.ts`.
- [ ] All text is wrapped using language translation (`useTranslation`). English is the default.

## 📂 Main Frontend Structure

```
frontend/
├── src/
│   ├── api-handlers/    # Backend-for-Frontend (BFF) Routes
│   ├── components/      # UI Atoms, Layouts, and Dashboard Widgets
│   ├── hooks/           # TanStack Query Integration
│   ├── locales/         # Translation data (EN & ID)
│   ├── routes/          # File-based routing (TanStack Router)
│   ├── services/        # HTTP connection logic to BFF/Backend
│   ├── store/           # Global State (Zustand)
│   ├── types/           # CENTRALIZED Interfaces & Types
│   └── utils/           # Pure helper functions
```

## ⚡ Quick Commands

Run frontend server:
```bash
npm run dev
```

If creating a new route in `src/routes`, sync the router:
```bash
npx @tanstack/router-cli generate
```

If modifying significant code, verify TypeScript Types:
```bash
npm run type-check
```

Run End-to-End Tests:
```bash
npx playwright test
```
