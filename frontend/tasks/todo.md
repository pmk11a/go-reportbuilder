# Task: Professional Patterns and Documentation

## Status
- [x] Initialize Tasks Directory <!-- id: 0 -->
- [x] Analyze Backend Code Patterns <!-- id: 1 -->
- [x] Analyze Frontend Code Patterns <!-- id: 2 -->
- [x] Create Backend Professional Documentation (CODE_GUIDE.md) <!-- id: 3 -->
- [x] Create Frontend Professional Documentation (CODE_GUIDE.md) <!-- id: 4 -->
- [x] Connect Backend to SQL Server (sqlsrv) <!-- id: 6 -->
- [x] Update Authentication to use Username instead of Email <!-- id: 7 -->
- [x] Implement Backend Middleware (JWT & RBAC) <!-- id: 8 -->
- [x] Implement Frontend Route Protection (TanStack Router) <!-- id: 9 -->
- [x] Implement Role-Based Redirect after Login <!-- id: 10 -->
- [x] Add Automation Testing for Backend (Go) <!-- id: 11 -->
- [x] Add Automation Testing for Frontend (TanStack) <!-- id: 12 -->
- [x] Implement BFF Logic Layer (localhost:3000 -> localhost:8080) <!-- id: 14 -->
- [x] Update Documentation (CODE_GUIDE.md) with new patterns <!-- id: 13 -->
- [x] Review and Verify Documentation <!-- id: 5 -->
- [x] Resolve Route Conflicts and Fix Testing Files <!-- id: 15 -->
- [x] Refactor Backend into Modular Structure <!-- id: 16 -->
    - [x] Move Routing to separate file <!-- id: 17 -->
    - [x] Move Seeding to separate file <!-- id: 18 -->
    - [x] Move Migrations to separate file (selective for users table) <!-- id: 19 -->
    - [x] Clean up main.go (wiring only) <!-- id: 20 -->

## Plan Details

### 1. Initialize Tasks Directory
- Create `tasks/todo.md` (this file)
- Create `tasks/lessons.md`

### 2. Analyze Backend Code Patterns
- Check `backend/internal/` for layers (domain, usecase, repository, delivery/http).
- Verify Dependency Injection usage.
- Look for error handling and logging patterns.

### 3. Analyze Frontend Code Patterns
- Check `frontend/src/` for directory structure.
- Verify TanStack Query usage (hooks, query keys).
- Look for state management and component organization.

### 4. Create Backend Documentation
- Document the Clean Architecture layers.
- Detail the flow of data.
- Provide examples of Repository and Service patterns.

### 5. Create Frontend Documentation
- Document the feature-based folder structure.
- Detail TanStack Query best practices (Query Factories, Hook-based API calls).
- Detail UI component standards.

## Review Section
- [ ] Documentation is clear and follows professional standards.
- [ ] Project structure is aligned with documented patterns.
