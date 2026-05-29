# DAPEN - Full-Stack Application

A modern full-stack web application built with **Next.js** (Frontend) and **Golang** (Backend), featuring a comprehensive design system, rich component library, and BFF (Backend For Frontend) architecture.

## 📋 Overview

DAPEN is a scalable, feature-rich application with:
- **Frontend**: Modern React-based UI with Next.js
- **Backend**: RESTful API with Golang & Gin
- **Architecture**: Backend For Frontend (BFF) pattern
- **Design System**: Complete theme system with light/dark mode
- **Components**: 50+ reusable UI components
- **Type-Safe**: Full TypeScript support
- **State Management**: Zustand for global state

## 🏗️ Project Structure

```
dapen/
├── golang-next/                 # Main application directory
│   ├── frontend/               # Next.js frontend application
│   │   ├── README.md           # Frontend documentation
│   │   ├── src/                # Source code
│   │   ├── package.json        # npm dependencies
│   │   └── tsconfig.json       # TypeScript config
│   │
│   └── backend/                # Golang backend API
│       ├── README.md           # Backend documentation
│       ├── cmd/                # Application entry points
│       ├── internal/           # Private packages
│       ├── go.mod              # Go dependencies
│       └── go.sum              # Dependency locks
│
├── laravel-next/               # Original Laravel application (reference)
├── template/                   # Design system & components template
├── init/                       # Initialization scripts
├── plan.md                     # Project plan
├── todo.md                     # Task tracking
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ & **npm** 9+
- **Go** 1.25.5+
- **MongoDB** (for database)
- **Git**

### Frontend Setup

```bash
cd golang-next/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

See [frontend/README.md](golang-next/frontend/README.md) for detailed instructions.

### Backend Setup

```bash
cd golang-next/backend

# Download dependencies
go mod download

# Run development server
go run ./cmd/main.go

# API available at http://localhost:8080
```

See [backend/README.md](golang-next/backend/README.md) for detailed instructions.

---

## 📚 Documentation

### Frontend
- **Location**: `golang-next/frontend/README.md`
- **Tech**: Next.js 16, React 19, TypeScript 5
- **Styling**: TailwindCSS 4 + CSS Variables
- **State**: Zustand 5
- **Components**: 50+ UI components (Radix UI)

**Key Features:**
- ✅ Component library with design system
- ✅ Theme system (light/dark mode)
- ✅ Rich text editor (Tiptap)
- ✅ Data visualization (Recharts)
- ✅ Form validation (Zod + React Hook Form)
- ✅ Mobile responsive design
- ✅ Type-safe development

### Backend
- **Location**: `golang-next/backend/README.md`
- **Tech**: Go 1.25.5, Gin Framework 1.12
- **Database**: MongoDB 2.5
- **API**: RESTful JSON API

**Key Features:**
- ✅ Modular folder structure
- ✅ Data validation & error handling
- ✅ CORS support
- ✅ JWT authentication (planned)
- ✅ Role-based access control (planned)
- ✅ Structured logging

---

## 🔄 Architecture

### BFF (Backend For Frontend) Pattern

```
┌─────────────────────────────────────────────────────┐
│         Next.js Frontend (Port 3000)                │
│  - React Components                                 │
│  - TailwindCSS + Design System                      │
│  - Zustand State Management                         │
│  - Client-side Validation (Zod)                     │
└────────────────────────┬────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────┐
│         Golang Backend (Port 8080)                  │
│  - REST API Endpoints                               │
│  - Business Logic                                   │
│  - Data Validation                                  │
│  - Database Integration                             │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│         MongoDB Database                            │
│  - User Data                                        │
│  - Application Data                                 │
│  - Audit Logs                                       │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction** → Frontend component
2. **Frontend validates** using Zod schemas
3. **Sends HTTP request** to Backend API
4. **Backend validates** input again
5. **Backend processes** business logic
6. **Backend queries** MongoDB
7. **Backend returns** JSON response
8. **Frontend updates** Zustand store
9. **React re-renders** components
10. **User sees** updated UI

---

## 🛠️ Technology Decisions

### Why Next.js?
- App Router for modern routing
- Server components for performance
- Built-in TypeScript support
- Zero-config setup
- Vercel deployment ready

### Why Golang?
- Fast, compiled language
- Excellent concurrency support
- Simple deployment (single binary)
- Great for APIs & microservices
- Powerful standard library

### Why Zustand?
- Lightweight state management
- No provider hell
- TypeScript friendly
- Persist middleware for localStorage
- Easy to learn & use

### Why TailwindCSS?
- Utility-first CSS
- Rapid development
- Small bundle size with PurgeCSS
- CSS variables for theming
- Great developer experience

---

## 🎨 Design System

### Theme Configuration

Themes are defined in `frontend/src/lib/theme.ts`:

```typescript
export const LIGHT_THEME = {
  colors: {
    primary: '215 90% 56%',
    secondary: '160 84% 39%',
    accent: '280 85% 55%',
    // ... more colors
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
  }
}
```

### CSS Variables

Generated in `globals.css` for all Tailwind utilities:

```css
:root {
  --color-primary: 215 90% 56%;
  --color-background: 0 0% 100%;
  --color-foreground: 215 15% 15%;
  /* ... */
}

[data-theme="dark"] {
  --color-background: 215 28% 7%;
  --color-foreground: 0 0% 98%;
  /* ... */
}
```

### Using the Theme

```tsx
import { Button } from '@/components/ui';
import { useTheme } from '@/store/themeStore';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button onClick={toggleTheme}>
      Current theme: {theme}
    </Button>
  );
}
```

---

## 📦 Component Library

### Categories (50+ Components)

**Overlay Components (20+)**
- Buttons, Badges, Dialogs, Dropdowns, Modals, Popovers, Sheets, Tooltips

**Form Components (15+)**
- Input, Textarea, Select, Checkbox, Radio, Switch, Date Picker, File Upload, Rich Text Editor

**Feedback Components (8+)**
- Alert, Toast, Progress, Skeleton, Loading State, Empty State

**Layout Components (5+)**
- Card, Divider, Separator, Scroll Area

**Navigation Components (7+)**
- Breadcrumb, Tabs, Pagination, Sidebar, Menubar, Steps

**Data Components (5+)**
- Table, Chart, Timeline, Stat, Data Pagination

All components are:
- ✅ Typed with TypeScript
- ✅ Styled with TailwindCSS
- ✅ Responsive design
- ✅ Accessible (WCAG)
- ✅ Configurable via props

---

## 🔐 Security Considerations

### Frontend
- Input validation with Zod
- XSS prevention via React escaping
- CSRF tokens in forms
- Secure cookie handling
- CSP headers

### Backend
- Input validation on all endpoints
- Password hashing (bcrypt planned)
- JWT token validation
- CORS configuration
- Rate limiting (planned)
- SQL injection prevention (MongoDB)

---

## 🧪 Testing

### Frontend Testing (Planned)
```bash
cd golang-next/frontend
npm test                    # Unit tests
npm run test:e2e            # E2E tests
```

### Backend Testing (Planned)
```bash
cd golang-next/backend
go test ./...              # Unit tests
go test -v ./...           # Verbose
```

---

## 📈 Performance Optimization

### Frontend
- Code splitting per route
- Image optimization
- CSS purging with TailwindCSS
- Lazy loading components
- Bundle analysis

### Backend
- Connection pooling
- Database indexing
- Caching strategies
- Goroutine management
- Load testing ready

---

## 🚢 Deployment

### Frontend Deployment Options

**Vercel (Recommended)**
```bash
# Auto-deploy from GitHub
```

**Self-Hosted**
```bash
npm run build
npm start
```

**Docker**
```bash
docker build -t dapen-frontend .
docker run -p 3000:3000 dapen-frontend
```

### Backend Deployment Options

**Standalone Binary**
```bash
GOOS=linux GOARCH=amd64 go build -o bin/dapen-backend ./cmd
```

**Docker**
```bash
docker build -t dapen-backend .
docker run -p 8080:8080 dapen-backend
```

**Docker Compose** (Full Stack)
```bash
docker-compose up
```

---

## 🐛 Troubleshooting

### Common Issues

**Frontend won't start**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run dev
```

**Backend won't connect to MongoDB**
```bash
# Start MongoDB
docker run -d -p 27017:27017 mongo:latest

# Check MONGO_URI in .env
```

**Port conflicts**
```bash
# Frontend on different port
npm run dev -- -p 3001

# Backend on different port
PORT=8081 go run ./cmd/main.go
```

---

## 📝 Development Workflow

### Daily Development

1. **Start Backend**
   ```bash
   cd golang-next/backend
   go run ./cmd/main.go
   ```

2. **Start Frontend** (in new terminal)
   ```bash
   cd golang-next/frontend
   npm run dev
   ```

3. **Make changes** & hot reload
4. **Test in browser** at `http://localhost:3000`
5. **Check API** at `http://localhost:8080/health`

### Creating a New Feature

1. **Design API endpoint** in backend
2. **Create request/response** types
3. **Implement handler** & business logic
4. **Create Zod schema** in frontend
5. **Create UI components** & pages
6. **Integrate with API** client
7. **Test end-to-end**

---

## 📚 Learning Resources

### Frontend Learning Path
1. [Next.js Documentation](https://nextjs.org/docs)
2. [React Fundamentals](https://react.dev)
3. [TailwindCSS Guide](https://tailwindcss.com)
4. [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Backend Learning Path
1. [Go Tour](https://go.dev/tour)
2. [Gin Framework Guide](https://gin-gonic.com/)
3. [MongoDB Go Driver](https://www.mongodb.com/docs/drivers/go/)

---

## 🤝 Contributing

### Code Standards
- Use TypeScript for frontend
- Use Go idioms for backend
- Write meaningful commit messages
- Document public functions
- Add comments for complex logic

### Submitting Changes
1. Create feature branch
2. Make changes
3. Write/update tests
4. Create pull request
5. Get review & merge

---

## 📊 Project Status

- ✅ Project structure created
- ✅ Frontend: Next.js setup with components
- ✅ Backend: Gin framework with basic endpoints
- ✅ Design system integrated
- ✅ Theme system (Zustand)
- 🔄 Authentication implementation
- 🔄 Database integration
- 📋 Testing infrastructure
- �� CI/CD pipeline

---

## 📞 Support & Questions

For questions or issues:
1. Check respective README files
2. Review code comments
3. Check existing documentation
4. Create an issue in repository

---

## 📄 License

This project is part of DAPEN application.

---

## 🎯 Next Steps

1. **Implement Authentication**
   - JWT tokens
   - Password hashing
   - Session management

2. **Database Integration**
   - MongoDB models
   - CRUD operations
   - Migrations

3. **Feature Development**
   - User dashboard
   - Data management
   - Reporting

4. **Testing & QA**
   - Unit tests
   - Integration tests
   - E2E tests

5. **Deployment**
   - CI/CD pipeline
   - Docker setup
   - Production deployment

---

**Last Updated**: April 22, 2026  
**Current Version**: 0.1.0  
**Status**: Active Development 🚀

For detailed information, see:
- [Frontend Documentation](golang-next/frontend/README.md)
- [Backend Documentation](golang-next/backend/README.md)
