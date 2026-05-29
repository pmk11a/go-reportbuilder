# BLACKBOX.md - Project Context for Future Interactions

This file provides AI assistants (Claude) with comprehensive context for working on the DAPEN full-stack application.

---

## 📋 Project Overview

**DAPEN** is a full-stack web application built with:
- **Frontend**: TanStack Start (React-based SPA with file-based routing), React 19, TypeScript, TailwindCSS 4
- **Backend**: Golang with Gin framework, MongoDB
- **Architecture**: Backend-For-Frontend (BFF) pattern
- **Location**: `/Users/codemas/Storage/my-htdocs/dapen/golang-next`

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | TanStack Start | 1.60.0 |
| UI Library | React | 19.2.4 |
| Styling | TailwindCSS | 4.x |
| State Management | Zustand | 5.0.12 |
| Form Validation | Zod | 4.3.6 |
| Form Handling | React Hook Form | 7.73.1 |
| Rich Text Editor | Tiptap | 3.22.4 |
| Data Visualization | Recharts | 3.8.1 |
| UI Components | Radix UI | latest |
| Backend Framework | Gin (Go) | 1.12.0 |
| Database | MongoDB | 2.5 |
| Go Version | Go | 1.25.5 |

---

## 🚀 Quick Start Commands

### Frontend Development

```bash
cd /Users/codemas/Storage/my-htdocs/dapen/golang-next/frontend

# Install dependencies (already done)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npm run type-check
```

**Frontend runs on**: http://localhost:5173 (Vite dev server)

### Backend Development

```bash
cd /Users/codemas/Storage/my-htdocs/dapen/golang-next/backend

# Download dependencies
go mod download

# Run development server
go run ./cmd/main.go

# Build binary
go build -o bin/dapen-backend ./cmd/main.go

# Run tests
go test ./...
```

**Backend runs on**: http://localhost:8080

---

## 🌍 Environment Configuration

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Backend (.env)

```env
PORT=8080
GIN_MODE=debug
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=dapen
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## 🏗️ Project Structure

```
golang-next/
├── backend/                    # Golang API server
│   ├── cmd/
│   │   └── main.go           # Entry point
│   ├── internal/
│   │   ├── config/          # Environment configuration
│   │   ├── handlers/       # HTTP request handlers
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Database queries
│   │   ├── middleware/     # HTTP middleware
│   │   └── utils/         # Helper functions
│   ├── pkg/                # Public packages
│   ├── go.mod              # Go dependencies
│   └── README.md           # Backend documentation
│
└── frontend/                 # TanStack Start SPA
    ├── src/
    │   ├── app/            # App pages (file-based routing)
    │   ├── components/    # Shared UI components
    │   │   └── ui/        # 50+ Radix-based components
    │   ├── features/      # Feature modules
    │   ├── lib/           # Utilities (api, theme, utils)
    │   ├── hooks/         # Custom React hooks
    │   ├── store/         # Zustand stores
    │   └── styles/        # Global styles
    ├── package.json        # npm dependencies
    └── tailwind.config.ts # Tailwind configuration
```

---

## 🔌 API Communication

### Pattern

The frontend uses native `fetch` (no Axios) to communicate with the backend:

```typescript
// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(await response.text());
  }
  
  return response.json();
}
```

---

## 📦 Feature-Based Structure

### Frontend Features (`src/features/`)

```
src/features/
├── auth/           # Authentication (login, register, logout)
├── dashboard/      # Dashboard page
└── [feature]/    # Additional features
```

Each feature contains:
- `schemas/` - Zod validation schemas
- `services/` - API calls
- `store/` - Zustand store
- `hooks/` - Custom hooks
- `types/` - TypeScript types

### Backend Handlers (`internal/handlers/`)

```
internal/handlers/
├── auth.go        # Authentication handlers
├── dashboard.go  # Dashboard handlers
└── [feature].go # Additional handlers
```

---

## 🎨 Design System

### Theme System

Themes are configured in `src/lib/theme.ts` and use CSS variables:

```typescript
// Theme uses HSL format for TailwindCSS compatibility
export const LIGHT_THEME = {
  colors: {
    primary: '215 90% 56%',
    // ...
  },
};
```

### CSS Variables

Defined in `src/styles/globals.css`:
- Light theme in `:root`
- Dark theme in `[data-theme="dark"]`

---

## 🧩 UI Component Library

### Categories (50+ Components)

| Category | Examples |
|----------|----------|
| **Form** | Input, Textarea, Select, Checkbox, Radio, Switch, PasswordInput |
| **Feedback** | Alert, Toast, Skeleton, Loading, Empty State |
| **Overlay** | Button, Dialog, Modal, Popover, Dropdown, Tooltip |
| **Navigation** | Navbar, Sidebar, Breadcrumb, Tabs, Pagination |
| **Data** | Table, Card, Chart |

All components are:
- ✅ Typed with TypeScript
- ✅ Styled with TailwindCSS
- ✅ Responsive
- ✅ Accessible

---

## 🔐 Authentication

### Current Status

- Backend: Basic JWT structure planned
- Frontend: Auth store with Zustand (in `src/features/auth/store/`)

---

## 🧪 Testing

### Frontend

```bash
npm run lint        # ESLint
npm run type-check # TypeScript
```

### Backend

```bash
go test ./...     # Run tests
go vet ./...     # Lint
go fmt ./...     # Format
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `frontend/README.md` | Frontend setup & usage |
| `backend/README.md` | Backend setup & API docs |
| `CLAUDE.md` (frontend) | Frontend dev guide |
| `CLAUDE.md` (backend) | Backend dev guide |
| `PLAN.md` | Project plan |
| `TODO.md` | Task tracking |

---

## ✅ Common Tasks

### Add New Feature

1. **Backend**: Create handler in `internal/handlers/`
2. **Backend**: Create service in `internal/services/`
3. **Backend**: Create repository in `internal/repositories/`
4. **Frontend**: Create feature module in `src/features/`
5. **Frontend**: Add Zod schema in `src/features/[name]/schemas/`
6. **Frontend**: Create API service in `src/features/[name]/services/`
7. **Frontend**: Create page in `src/app/[name]/page.tsx`

### Add UI Component

1. Create component in `src/components/ui/[category]/`
2. Export from `src/components/ui/index.ts`
3. Use in pages/features

---

## 🐛 Troubleshooting

### Frontend Issues

**Build errors:**
```bash
npm install
npm run build
```

**Type errors:**
```bash
npm run type-check
```

**API connection failed:**
- Check backend is running on port 8080
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Backend Issues

**MongoDB connection:**
```bash
# Start MongoDB
docker run -d -p 27017:27017 mongo:latest
```

**Port conflicts:**
```bash
# Use different port
PORT=8081 go run ./cmd/main.go
```

---

## 🔗 Key Dependencies

### Frontend

- `@tanstack/react-start` - Framework
- `@tanstack/react-router` - Routing
- `@tanstack/react-query` - Data fetching
- `react-hook-form` - Form handling
- `zod` - Validation
- `zustand` - State management
- `recharts` - Charts
- `@tiptap/react` - Rich text editor
- `@radix-ui/*` - UI primitives

### Backend

- `github.com/gin-gonic/gin` - Web framework
- `go.mongodb.org/mongo-driver/v2` - Database
- `github.com/golang-jwt/jwt/v5` - JWT (planned)
- `golang.org/x/crypto` - Password hashing

---

## 📊 Project Status

| Component | Status |
|-----------|--------|
| Frontend Build | ✅ Working |
| Backend Server | ✅ Running on :8080 |
| UI Components | ✅ 50+ Ready |
| Theme System | ✅ Light/Dark |
| Auth (Backend) | 🔄 Planned |
| Auth (Frontend) | 🔄 Planned |
| MongoDB Integration | 🔄 Planned |

---

**Last Updated**: April 24, 2026  
**Version**: 0.1.0  
**Status**: Active Development