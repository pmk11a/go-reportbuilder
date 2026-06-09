# CLAUDE.md — Tasks Directory

## Overview

This directory contains all task documentation for the DAPEN project. All documentation is in English.

```
tasks/
├── CLAUDE.md                  # This file
├── TASK-XXX-short-name.md     # Individual task files
├── reports/                   # Task status reports
├── architect-prompt.md        # /architect command template
└── *_SUMMARY.md               # Session summaries
```

---

## Task File Naming

**Format:** `TASK-XXX-short-kebab-case-description.md`

- 3-digit zero-padded number (001, 002, ...)
- kebab-case description
- `.md` extension

Check existing tasks before creating new ones to avoid number conflicts.

---

## Task Lifecycle States

```
📋 TODO → ⏳ IN_PROGRESS → ✅ COMPLETED
               ↓
           ❌ BLOCKED
           ↓
       🔄 SUCCEEDED_BY
```

| State | When |
|---|---|
| `📋 TODO` | Defined, not yet started |
| `⏳ IN_PROGRESS` | Active development |
| `✅ COMPLETED` | All acceptance criteria met |
| `❌ BLOCKED` | External dependency blocking work |
| `🔄 SUCCEEDED_BY` | Large task closed, split into focused tasks |

**Status format:**
```
## Status
✅ **COMPLETED** - June 9, 2026
```

**Invalid transitions:** `TODO → COMPLETED` (must pass through IN_PROGRESS), `COMPLETED → IN_PROGRESS`.

---

## Large Task Closure Policy

Close with `SUCCEEDED_BY` when:
1. Scope grew 2x+ beyond estimate
2. Task encompasses 3+ distinct features
3. Some criteria complete, others require significant work
4. Requirements changed during implementation
5. Technical debt discovered requiring refactoring first

**Closure process:**
1. Change status to `🔄 SUCCEEDED_BY: TASK-XXX, TASK-YYY`
2. Add "What Was Accomplished" section
3. Add "Remaining Work" section
4. Create successor tasks (one per feature/area)
5. Update feature `CLAUDE.md` files to reflect completed work

---

## Required Task File Structure

```markdown
<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-XXX: Task Title

## Business Problem
[Clear description of the business need or user pain point]

## Priority: [Critical | High | Medium | Low]

## Status
📋 **TODO**

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## User Stories
**As a [role]**
I want to [action]
So that [benefit]

## Implementation Plan
[Detailed breakdown of work]

## Testing Approach
[How this will be tested]

## Estimate
**Hours**: XX

## Dependencies
- TASK-XXX: Description
- External system

## Risks & Mitigations
[Known risks and strategies]

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Tests passing (80%+ coverage for backend)
- [ ] Code reviewed
- [ ] Documentation updated
```

---

## Testing Requirements

1. **User Scenarios MANDATORY** — every task MUST document explicit positive, negative, and edge case scenarios.

2. **Test file location rules:**
   - Frontend unit: adjacent to source — `[filename].test.ts` or `[filename].test.tsx`
   - Frontend E2E: `frontend/e2e/[feature].spec.ts`
   - Backend unit: adjacent to source — `[filename]_test.go`
   - Backend E2E: `backend/tests/e2e/[feature]_e2e_test.go`

3. **Acceptance criteria per scenario:**
   - `- [x] ✅ PASS: <scenario>`
   - `- [x] ❌ FAIL: <scenario>`
   - `- [ ] ⬜ PENDING: <scenario>`

---

## Quality Gates

### Before Marking COMPLETED

**Backend tasks:**
- [ ] Go compiles with zero errors (`go build ./...`)
- [ ] Unit tests ≥80% coverage
- [ ] E2E tests pass
- [ ] All endpoints verified
- [ ] Swagger annotations added; `swag init` run

**Frontend tasks:**
- [ ] `npm run type-check` exits 0
- [ ] Runtime verification (navigate all pages with all data scenarios)
- [ ] Design system compliant (no Glassmorphism, Shadcn-style only)
- [ ] i18n keys added to both `locales/en` and `locales/id`
- [ ] Playwright E2E tests pass

**Full-stack tasks:** Meet both sets above, plus:
- [ ] Real API integration (no mock data)
- [ ] Error handling verified (all scenarios via `errorMapper.ts`)
- [ ] Loading + error states verified

---

## Estimation Guidelines

| Category | Hours | Examples |
|---|---|---|
| Trivial | 1–4h | Simple UI fix, doc update |
| Small | 4–8h | Single API endpoint, simple feature |
| Medium | 8–16h | Multi-step feature, backend + frontend |
| Large | 16–24h | Complex feature, multiple components |
| X-Large | 24–40h | Major feature, system integration |
| Epic | 40+h | Must be split |

**Red flags (split the task):**
- Estimate >40h
- More than 15 acceptance criteria
- Touches 5+ feature directories
- Requires 3+ specialist types

---

## Feature CLAUDE.md Maintenance

Update the feature's `CLAUDE.md` whenever task work involves:
1. New/modified API endpoints
2. Database schema changes
3. New UI components
4. Dependency changes
5. Bug fixes (remove stale "known issues")

**Always commit `CLAUDE.md` changes WITH code changes in the same commit.**

---

## Agent Support

- `@dapen-backend` — Go/Gin development (Domain-Based + DDD-Lite)
- `@dapen-frontend` — React/Vite development
- `@dapen-qa` — E2E Playwright testing and coverage enforcement

---

## Backend Feature Template

```markdown
<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-XXX: [Feature Name]

## Business Problem
[What user problem does this solve?]

## Priority: High

## Status
📋 **TODO**

## Acceptance Criteria
- [ ] Database schema mapped via GORM
- [ ] Repository layer with interfaces
- [ ] Service layer with tests (80%+ coverage)
- [ ] Handler layer with standardized JSON response
- [ ] All endpoints verified
- [ ] CLAUDE.md updated

## Implementation Plan

### Database Schema
[GORM Structs]

### API Endpoints
- `POST /api/v1/endpoint` - Description

## Testing Approach
- Unit tests: `testify/mock`
- Integration tests: `httptest`

## Estimate
**Hours**: XX

## Dependencies
- Database structure
- JWT Authentication middleware

## Definition of Done
- [ ] 80%+ test coverage
- [ ] All endpoints verified
- [ ] CLAUDE.md updated
```

---

## Frontend Feature Template

```markdown
<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-XXX: [Feature Name]

## Business Problem
[What user problem does this solve?]

## Priority: High

## Status
📋 **TODO**

## Acceptance Criteria
- [ ] Uses only design system components (no Glassmorphism)
- [ ] State managed with Zustand/TanStack Query
- [ ] Real API integration via services layer
- [ ] Error handling via errorMapper.ts
- [ ] Skeleton loading implemented
- [ ] `npm run type-check` exits 0
- [ ] Runtime verification completed
- [ ] CLAUDE.md updated

## Testing Approach
- Playwright E2E for user flows
- Runtime verification across all data scenarios

## Estimate
**Hours**: XX

## Dependencies
- Design system components
- Backend API endpoints (BFF)

## Definition of Done
- [ ] Type-check passes
- [ ] Runtime verified
- [ ] Design system compliant
- [ ] CLAUDE.md updated
```
