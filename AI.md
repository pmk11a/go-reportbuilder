# AI.md - AI Agent Quick Reference
## DAPEN System Development Guidelines

> **📚 For detailed patterns and workflows, see [.gemini/ARCHITECTURE.md](./.gemini/ARCHITECTURE.md)**
>
> This project uses a **three-tier AI Agent customization system**:
> - **Skills** (`.gemini/skills/`) - Domain knowledge with progressive disclosure
> - **Subagents** (`.gemini/agents/`) - Specialized autonomous workers
> - **Slash Commands** - Workflow triggers (e.g., `/architect`)

## 🎯 Essential Rules

### 🏗️ **RULE #0: ALWAYS DELEGATE TO SPECIALIZED AGENTS (CRITICAL)**

**YOU ARE THE ARCHITECT, NOT THE BUILDER.**

- **NEVER do implementation work directly** - Always delegate to specialized agents
- **Think hard, then delegate** - Analyze the request, plan the approach, then launch the appropriate agent
- **Default to agents for EVERYTHING:**
  - Backend work → `@dapen-backend` agent
  - Frontend work → `@dapen-frontend` agent
  - E2E testing → `@dapen-qa` agent
  - Architecture/Research → `@research-analyst` or equivalent
  - Project management → `@project-manager` agent

- **Only do direct work for:**
  - Quick file reads to understand context
  - Small edits (1-2 line changes)
  - Running simple commands (git status, linting, etc.)
  - Coordinating between agents

**Example workflow:**
```
User: "Fix the login page error"
❌ WRONG: Read files, edit code, test directly
✅ RIGHT:
  1. Think: "This needs frontend debugging and fixing"
  2. Launch: @dapen-frontend agent
  3. Monitor: Review agent's work
  4. Verify: Launch @dapen-qa agent if needed
```

---

### 📋 Core Development Rules

1. **ENGLISH LANGUAGE MANDATORY** - All files, including project code (variable names, comments, UI text if applicable) and documentation files (.md), MUST be written in English.
2. **MANDATORY TESTING** - You MUST create E2E tests (Playwright) and Unit Tests when adding new features or changing code (TDD is HIGHLY ENCOURAGED).
3. **Never duplicate code** - Abstract shared logic into `utils` or `hooks`.
4. **Read before write** - Always read files before editing.
5. **Prefer editing to creating** - Modify existing files when possible.
6. **No unsolicited documentation** - Only create docs when explicitly asked.
7. **Never commit secrets** - No API keys, passwords, or sensitive data.
8. **Use existing patterns** - Follow the Clean Architecture and frontend BFF conventions.
9. **CREATE TASK FILES PER FEATURE** - If a request is a new feature or has a large scope, you MUST create separate task files for each distinct feature in the `tasks/` directory (e.g., `tasks/TASK-XXX-feature-name.md`) to track progress before starting. Do not combine multiple unrelated features into a single task file.
10. **VERIFY COMPILATION** - Golang code MUST compile with zero errors before handoff.
11. **MANDATORY RUNTIME VERIFICATION** - React app MUST run without errors on ALL pages with ALL data scenarios (`npm run type-check` must pass).
12. **DESIGN SYSTEM ENFORCEMENT** - Use ONLY local design system components from `frontend/src/components/ui`. NO Glassmorphism.
13. **Complete resolution only** - Never stop at "good enough".
14. **Progressive quality gates** - Verify quality continuously, not just at completion.
15. **UPDATE FEATURE AI.MD** - When changing ANY feature code, update its contextual `AI.md` file in the SAME commit.
16. **BATCH ERROR COLLECTION (MANDATORY)** - NEVER run individual checks one-by-one and fix in a loop. ALWAYS run `./scripts/check-all.sh` first to collect ALL errors and warnings into `tmp/` in one pass, then fix everything in batch. This prevents token waste from repeated run→fix→run cycles.

## 📂 Project Structure

```
dapen-golang-next/
├── .gemini/
│   ├── ARCHITECTURE.md          # Core architecture & tech stack documentation
│   ├── skills/                  # Domain knowledge & scripts
│   └── agents/                  # Specialized subagents
├── .templates/                  # Project templates
│   └── FEATURE_AI_TEMPLATE.md   # Feature documentation template
├── tasks/                       # Task tracking with Task Lifecycle format
│   └── AI.md                    # Tasks-specific rules
├── frontend/
│   ├── AI.md                    # Frontend quick reference
│   └── src/
│       ├── api-handlers/        # BFF Routes (Backend for Frontend)
│       ├── components/          # Reusable UI components
│       ├── hooks/               # React & TanStack Query hooks
│       ├── locales/             # i18n Translations
│       ├── routes/              # TanStack Router files
│       ├── services/            # API integration layer
│       ├── store/               # Zustand global state
│       └── types/               # Centralized TypeScript types
├── backend/
│   ├── AI.md                    # Backend quick reference
│   ├── cmd/                     # Entry point (main.go)
│   └── internal/
│       ├── config/              # Environment config
│       ├── db/                  # DB Connection & AutoMigrate
│       ├── dto/                 # JSON Payloads
│       ├── handlers/            # HTTP Controllers
│       ├── middleware/          # Auth, Rate Limiting, Logging
│       ├── models/              # GORM Database Entities
│       ├── repositories/        # Database Interactions
│       ├── routes/              # Gin Router Setup
│       └── services/            # Business Logic
```

## 🔧 Tech Stack

**Frontend:** React 18+ (Vite, Tailwind v4, TanStack Router, TanStack Query, Zustand)
**Backend:** Golang 1.20+ (Gin Framework, GORM)
**Database:** SQL Server (Legacy mappings) / MongoDB

## 🧪 Quick Commands

### Server Startup
```bash
# Backend
cd backend && go run ./cmd/main.go

# Frontend
cd frontend && npm run dev
```

### Database Migrations (CRITICAL RULES)

**⚠️ MANDATORY: Follow these rules to prevent database issues**

- ❌ **NEVER** use GORM `AutoMigrate` at runtime for standard API requests.
- ✅ **ALWAYS** use the manual CLI flag for migrations:
```bash
cd backend && go run cmd/main.go --migrate
```
- ✅ **Seeding Initial Data**:
```bash
cd backend && go run cmd/main.go --seed
```
- **Legacy Tables**: Do NOT add `CreatedAt`/`UpdatedAt` or change primary keys on legacy tables mapped via GORM.

### Quality Verification
```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MANDATORY: Run this FIRST before any individual check or fix
# Collects ALL errors & warnings into tmp/ in a single pass
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
./scripts/check-all.sh               # Run ALL checks (backend + frontend)
./scripts/check-all.sh --backend-only  # Backend only
./scripts/check-all.sh --frontend-only # Frontend only

# After the script runs, read ALL errors at once:
cat tmp/*_errors.log                 # All errors
cat tmp/*_warnings.log               # All warnings
cat tmp/check_report_*.md | tail -1  # Latest report path

# Shortcut targets:
# Backend:  make -C backend check-backend   then   make -C backend check-errors
# Frontend: npm --prefix frontend run check then   npm --prefix frontend run check:errors
```

### Individual checks (only AFTER check-all.sh)
```bash
# Type Checking (Frontend)
cd frontend && npm run type-check

# Linting & Vetting (Backend)
cd backend && go vet ./...
```

### Testing

**RULE: Always use `check-all.sh` instead of running tests directly to batch-collect errors.**

**Batch check (preferred):**
```bash
./scripts/check-all.sh               # Runs all tests + build + type-check at once
cat tmp/*_errors.log                 # See all test errors at once
```

**Backend (individual):**
```bash
cd backend
go test ./... -v             # Run all tests
go test -coverprofile=coverage.out ./... && go tool cover -func=coverage.out
```

**Frontend (individual):**
```bash
cd frontend
npm test -- --run            # Run unit tests once (no watch)
npx playwright test          # Run End-to-End Tests
```

## 📋 Task Status Format

```markdown
## Status
✅ **COMPLETED** - October 19, 2025
```

Statuses: `📋 **TODO**` | `⏳ **IN_PROGRESS** - Month Day, Year` | `✅ **COMPLETED** - Month Day, Year` | `❌ **BLOCKED** - Month Day, Year` | `🔄 **SUCCEEDED_BY**: TASK-XXX, TASK-YYY - Month Day, Year`

## 🔄 Task Lifecycle Management

### When to Close Large Tasks

Close tasks as SUCCEEDED_BY when:
1. **Scope grew 2x+ beyond estimate**
2. **Task encompasses 3+ distinct features**
3. **Some criteria complete, others need major work**
4. **Requirements changed during implementation**
5. **Technical debt discovered requiring refactoring**

### Closure Requirements

When closing with SUCCEEDED_BY:
- ✅ Add comprehensive "What Was Accomplished" section with detailed bullet lists
- ✅ Add "Remaining Work" section documenting deferred items
- ✅ Add "Succeeded By" section listing focused successor tasks
- ✅ Check off completed acceptance criteria
- ✅ Verify feature `AI.md` files are current

**See `tasks/AI.md` for complete task lifecycle documentation.**

## ⚡ Quality Gates (MANDATORY)

> **🚨 RULE #16**: Always run `./scripts/check-all.sh` to batch-collect ALL errors before
> attempting any fixes. Reading `tmp/*_errors.log` gives the full picture at once.

**Development Phase:**
- ✅ Code compiles without errors (Golang)
- ✅ `npm run type-check` passes (React)
- ✅ Unit tests pass
- ✅ No hardcoded secrets
- ✅ **RUNTIME VERIFICATION** - Verify UI components in the browser
- ✅ **Design system compliance** - NO Glassmorphism. Follow standard Shadcn UI styling.
- ✅ **API endpoint verification** - Call backend endpoints successfully

**Integration Phase:**
- ✅ End-to-End Playwright tests pass
- ✅ **Real API integration** - No mock data
- ✅ **Error handling verified** - All scenarios tested via `errorMapper.ts`

**Deployment Readiness:**
- ✅ ZERO compilation/type errors
- ✅ ZERO runtime errors
- ✅ All tests passing
- ✅ **Task documentation complete**

## 🏗️ Architecture Patterns

> **Detailed patterns in `.gemini/ARCHITECTURE.md`**

### Backend Development (Golang + Clean Architecture)

- Layered architecture strictly enforced: `handlers` -> `services` -> `repositories`.
- Models isolated in `models/`, DTOs isolated in `dto/`.
- Dependency injection via interfaces (`IUserService`).
- Standardized API responses wrapper.

### Frontend Development (React + BFF)

- STRICT Separation of Concerns: Types in `types/`, Fetching in `services/`, State in `store/`.
- No `axios` or `fetch` calls directly in UI components.
- i18n applied to all user-facing text.
- BFF layer (`api-handlers`) protects tokens in HttpOnly Cookies.

## 🚀 Slash Commands

### `/architect TASK-XXX`
Orchestrate complete feature implementation using specialized agents.

**What it does:**
1. Analyzes task requirements
2. Implements backend logic (via `@dapen-backend`)
3. Implements frontend UI & integration (via `@dapen-frontend`)
4. Runs E2E tests (via `@dapen-qa`)
5. Feedback loop until ALL quality gates pass
6. Updates documentation

**Usage:** `/architect 052` (for TASK-052)

### `/verify`
Run comprehensive quality verification checklist.

## 📍 Key Resources

- **Architecture docs:** `.gemini/ARCHITECTURE.md`
- **Task details:** `tasks/` directory
- **Frontend docs:** `frontend/AI.md`
- **Backend docs:** `backend/AI.md`

## 📚 Feature-Specific Documentation

Each feature folder (e.g., `frontend/src/components/dashboard` or `backend/internal/services/auth`) should contain its own `AI.md` documentation that auto-loads context when working in that directory.

### Documentation Template

Use `.templates/FEATURE_AI_TEMPLATE.md` when creating new feature documentation.

### What Each AI.md Contains

- **Business Purpose & User Stories** - Why the feature exists
- **Architecture & Data Flow** - How it works
- **Dependencies** - External modules/types
- **API Endpoints** (Backend)
- **UI Components** (Frontend)
- **Testing Guidance** - How to test, what to test

## 🔄 Documentation Maintenance (CRITICAL)

**RULE: Feature AI.md files MUST be kept up-to-date as code changes.**

### When to Update Feature AI.md Files

Update the relevant `AI.md` whenever you:
1. **Add/Modify API Endpoints** (Backend)
2. **Change Database Schema** (Backend)
3. **Add/Modify UI Components** (Frontend)
4. **Add/Change Dependencies**
5. **Update Acceptance Criteria**
6. **Fix Known Issues**

### Quick Update Checklist

```markdown
When modifying a feature:
- [ ] Update relevant sections in feature's AI.md
- [ ] Update cross-references if dependencies changed
- [ ] Update "Last Updated" date at bottom
- [ ] Commit AI.md changes WITH code changes
```

### AI Agent Responsibility

**FOR AI AGENTS:**
After completing work on ANY feature:
1. ✅ Review the feature's `AI.md` file
2. ✅ Update sections affected by your changes
3. ✅ Verify all file path references still accurate

---
*This is a quick reference. For comprehensive patterns and workflows, see `.gemini/ARCHITECTURE.md`*
