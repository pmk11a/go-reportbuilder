# 🎯 Quick Reference Guide

## 📁 Location
```
/Users/codemas/Storage/my-htdocs/dapen/
├── plan.md           # High-level project plan & architecture
├── todo.md          # Detailed todos with dependencies
└── init/
    ├── code-plan.md     # Technical implementation details
    └── QUICK_START.md   # This file
```

## 🚀 How to Use

### 1. View All Todos
```bash
cat /Users/codemas/Storage/my-htdocs/dapen/todo.md
```

### 2. View High-Level Plan
```bash
cat /Users/codemas/Storage/my-htdocs/dapen/plan.md
```

### 3. View Technical Implementation Plan
```bash
cat /Users/codemas/Storage/my-htdocs/dapen/init/code-plan.md
```

## 📊 Current Status

**Total Todos**: 23  
**Status**: All pending (ready to start Phase 1)

### Phase 1 Ready to Start (No dependencies):
1. **setup-folder-structure** - Create golang-next folder structure

Then can proceed with:
2. **setup-go-init** - Initialize Go module
3. **setup-nextjs-init** - Initialize NextJS

## 🔄 Workflow

### Starting a Todo:
```sql
UPDATE todos SET status = 'in_progress' WHERE id = 'setup-folder-structure';
```

### Completing a Todo:
```sql
UPDATE todos SET status = 'done' WHERE id = 'setup-folder-structure';
```

### Query Ready Todos (no pending dependencies):
```sql
SELECT t.* FROM todos t
WHERE t.status = 'pending'
AND NOT EXISTS (
    SELECT 1 FROM todo_deps td
    JOIN todos dep ON td.depends_on = dep.id
    WHERE td.todo_id = t.id AND dep.status != 'done'
);
```

## 📦 Key Technologies

### Backend (Go)
- **Framework**: Gin Gonic
- **Database**: PostgreSQL + GORM
- **Auth**: JWT + Refresh Tokens
- **Password**: bcrypt (golang.org/x/crypto)

### Frontend (NextJS)
- **Framework**: Next.js 16+ with App Router
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **Validation**: Zod
- **HTTP**: Native fetch (no axios)
- **UI Components**: From template/src/components/ui

## 🎨 Design System Key Points

1. **Theme Configurable**: Light/Dark modes via theme.ts
2. **CSS Variables**: All colors use HSL CSS variables
3. **Responsive**: Mobile-first responsive design
4. **Accessibility**: ARIA labels, keyboard navigation
5. **Components**: Button, Input, Card, Dialog, Table, Toast, etc.

## 🔐 Authentication Flow

```
Frontend: Login Form
    ↓
Backend: POST /api/auth/login
    ↓
Response: { access_token, refresh_token, user }
    ↓
Frontend: Store in localStorage + Zustand
    ↓
Frontend: Set Authorization header for API calls
    ↓
Backend: Verify JWT in middleware
    ↓
Response: Protected data
```

## 📋 Important Notes

- ✅ **NO axios**: Use native fetch or fetch wrapper
- ✅ **Feature-based**: Folder structure by feature, not by type
- ✅ **Type-safe**: Full TypeScript + Zod + Go interfaces
- ✅ **Modular**: Services, repositories, handlers separate
- ✅ **Error handling**: Consistent error responses
- ✅ **CORS**: Setup for local development
- ✅ **JWT**: 15-min access + 7-day refresh tokens

## 🛠️ Development Setup

### Environment Variables
```
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_THEME=light

# Backend (.env)
DATABASE_URL=postgres://user:pass@localhost:5432/dapen
JWT_SECRET=your-secret-key
PORT=8080
GIN_MODE=debug
```

## 📞 Ready to Start?

Say "mulai" or type the todo ID to begin Phase 1! 🚀

---

**Version**: 1.0  
**Created**: 2026-04-22  
**Last Updated**: 2026-04-22
