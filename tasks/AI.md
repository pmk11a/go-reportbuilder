# TASKS Directory - Project Management Documentation

## Overview

This directory contains all task documentation for the DAPEN System project. Tasks follow a structured lifecycle from creation through completion, with comprehensive documentation and integration for project tracking. All documentation must be written in English.

## Directory Structure

```
tasks/
├── AI.md                                        # This file
├── TASK-XXX-short-name.md                       # Individual task files
├── reports/                                     # Task status reports
├── architect-prompt.md                          # /architect command template
└── *_SUMMARY.md                                 # Session summaries and retrospectives
```

## Task File Naming Convention

**Format**: `TASK-XXX-short-kebab-case-description.md`

**Examples**:
- `TASK-052-react-nfc-communication-service.md`
- `TASK-068-user-function-department-fields.md`
- `TASK-072-function-based-permission-matrix-ui.md`

**Rules**:
- Always include 3-digit zero-padded task number (001, 002, etc.)
- Use kebab-case for description
- Keep description concise but descriptive
- Extension must be `.md`

## Task Numbering

Tasks are numbered sequentially starting from TASK-001. Check existing tasks before creating new ones to avoid number conflicts.

## Task Lifecycle

### Lifecycle States

Tasks progress through five distinct states:

```
📋 TODO → ⏳ IN_PROGRESS → ✅ COMPLETED
                ↓
            ❌ BLOCKED
```

**State Definitions**:

1. **📋 TODO**: Task is defined and ready for work but not yet started
2. **⏳ IN_PROGRESS**: Active development underway, includes date started
3. **✅ COMPLETED**: All acceptance criteria met, includes completion date
4. **❌ BLOCKED**: Work halted due to external dependency or issue, includes block date
5. **🔄 SUCCEEDED_BY**: Large task closed and split into smaller focused tasks

### State Transitions

**Valid Transitions**:
- `TODO → IN_PROGRESS`: Start work (add start date)
- `IN_PROGRESS → COMPLETED`: Finish work (add completion date, verify acceptance criteria)
- `IN_PROGRESS → BLOCKED`: Hit blocker (add block date, document blocker)
- `BLOCKED → IN_PROGRESS`: Blocker resolved (remove block, update date)
- `IN_PROGRESS → SUCCEEDED_BY`: Task too large, split into focused tasks

**Invalid Transitions**:
- `TODO → COMPLETED` (must go through IN_PROGRESS)
- `COMPLETED → IN_PROGRESS` (completed tasks don't reopen)

### Large Task Closure Policy

**When to Close Large Tasks**:

Tasks should be closed and succeeded by focused tasks when:
1. **Scope Expansion**: Original scope grew significantly beyond estimate (2x+ hours)
2. **Multiple Features**: Task encompasses 3+ distinct feature areas
3. **Mixed Status**: Some acceptance criteria complete, others require significant work
4. **Changed Requirements**: Business requirements evolved during implementation
5. **Technical Debt**: Implementation revealed need for refactoring before completion

**Closure Process**:

1. **Update Task File**:
   - Change status to `🔄 **SUCCEEDED_BY**: TASK-XXX, TASK-YYY, TASK-ZZZ - Month Day, Year`
   - Add "What Was Accomplished" section with detailed bullet lists
   - Add "Remaining Work" section documenting what's deferred
   - Add "Succeeded By" section listing successor tasks
   - Check off completed acceptance criteria
   - Verify feature AI.md files are current

2. **Create Successor Tasks**:
   - Each successor task focuses on ONE specific feature/area
   - Realistic hour estimates based on actual work patterns
   - Clear acceptance criteria (subset of original or new requirements)
   - References to parent task in Dependencies section

3. **Update Documentation**:
   - Confirm feature AI.md files reflect completed work
   - Update ARCHITECTURE.md if architectural decisions made
   - Create task closure report in reports/ directory (optional)

### Task Management Integration

**Every task file must include placeholder headers if synced to an external tracker like ClickUp**:

```markdown
<!-- Task Tracker ID: TODO -->
<!-- Task Tracker URL: TODO -->
```

## Task File Structure

### Required Sections

Every task file must include these sections:

```markdown
<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-XXX: Task Title

## Business Problem
[Clear description of the business need or user pain point]

## Priority: [Critical | High | Medium | Low]

## Status
[Emoji] **[STATE]** - Month Day, Year

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [x] Completed criterion (if partially complete)

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
- External system/library

## Risks & Mitigations
[Known risks and mitigation strategies]

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Tests passing (80%+ coverage for backend)
- [ ] Code reviewed
- [ ] Documentation updated

## Notes
[Additional context, decisions, technical details]
```

### Optional Sections (As Needed)

- **Technical Specifications**: Code examples, architecture diagrams
- **Database Schema**: SQL migrations, table definitions
- **API Endpoints**: Endpoint documentation with curl examples
- **UI Components**: React components, pages, state management
- **What Was Accomplished**: For succeeded/closed tasks
- **Remaining Work**: For succeeded/closed tasks
- **Succeeded By**: For succeeded/closed tasks

### Status Section Format (CRITICAL)

**Must follow exact format for syncing**:

```markdown
## Status
✅ **COMPLETED** - October 24, 2025
```

**Status Options**:
- `📋 **TODO**`
- `⏳ **IN_PROGRESS** - October 24, 2025`
- `✅ **COMPLETED** - October 24, 2025`
- `❌ **BLOCKED** - October 24, 2025`
- `🔄 **SUCCEEDED_BY**: TASK-XXX, TASK-YYY - October 24, 2025`

**Date Format**: `Month Day, Year` (e.g., "October 24, 2025")

## Task Creation Workflow

### Manual Creation

1. **Choose Task Number**: Check highest existing task, increment by 1
2. **Create File**: `TASK-XXX-description.md`
3. **Use Template**: Copy structure from similar task or use template below
4. **Fill Required Sections**: Business problem, acceptance criteria, estimate
5. **Add Placeholders**: Include TODO comments
6. **Commit**: `git add tasks/TASK-XXX-*.md && git commit -m "chore: create TASK-XXX"`

## Task Estimation Guidelines

### Estimation Principles

1. **Be Realistic**: Use actual velocity data, not ideal scenarios
2. **Include Testing**: Unit tests, integration tests, manual testing
3. **Include Documentation**: Feature AI.md updates, API docs
4. **Include Quality Gates**: Code review, security checks, runtime verification
5. **Buffer for Discovery**: Add 20-30% for unforeseen complexity

### Estimation Categories

| Category | Hours | Example Tasks |
|----------|-------|---------------|
| Trivial | 1-4h | Simple UI fixes, documentation updates |
| Small | 4-8h | Single API endpoint, simple feature |
| Medium | 8-16h | Multi-step feature, backend + frontend |
| Large | 16-24h | Complex feature with multiple components |
| X-Large | 24-40h | Major feature or system integration |
| Epic | 40+h | Should be split into smaller tasks |

### Red Flags (Task Too Large)

If your task has any of these, consider splitting:
- ✗ Estimate >40 hours
- ✗ More than 15 acceptance criteria
- ✗ Touches 5+ feature directories
- ✗ Requires 3+ different types of specialists
- ✗ "And" appears 5+ times in title

## Acceptance Criteria Best Practices

### SMART Criteria

Each criterion should be:
- **Specific**: Clear, unambiguous requirement
- **Measurable**: Can verify completion objectively
- **Achievable**: Realistic within task scope
- **Relevant**: Directly supports business goal
- **Testable**: Can write test to verify

### Examples

**Good Acceptance Criteria**:
- ✅ Backend API returns user list sorted by function field
- ✅ Frontend displays department filter dropdown with all departments
- ✅ Unit tests achieve 85%+ coverage on new UserService methods
- ✅ Credentials page loads in <2s with 1000+ records

**Bad Acceptance Criteria**:
- ✗ Make the UI better (not measurable)
- ✗ Improve performance (not specific)
- ✗ Add some tests (not testable)
- ✗ Update everything (too broad)

### Marking Complete

Only check off criteria when:
1. ✅ Feature fully implemented
2. ✅ Tests written and passing
3. ✅ Code reviewed and approved
4. ✅ Verified in running application
5. ✅ Documentation updated

**Never check off criteria that are "mostly done" or "works on my machine".**

## Testing Requirements

### Backend Tasks

**Mandatory**:
- ✅ Unit tests for all business logic (80%+ coverage via Go `testing` / testify)
- ✅ Integration tests for API endpoints
- ✅ API verification of all endpoints
- ✅ Error handling tests (invalid input, auth failures)

### Frontend Tasks

**Mandatory**:
- ✅ `npm run type-check` shows 0 errors
- ✅ Runtime verification (`npm run dev`)
- ✅ Navigate all pages with all data scenarios
- ✅ Design system compliance check

### Full-Stack Tasks

Must meet both backend AND frontend requirements above, plus:
- ✅ Playwright E2E Integration testing of frontend + backend
- ✅ Real API integration (no mock data)
- ✅ Error handling for network failures
- ✅ Loading states and error states verified

## Quality Gates

### Before Marking Task IN_PROGRESS

- ✅ Dependencies reviewed and available
- ✅ Acceptance criteria understood
- ✅ Related feature AI.md files read
- ✅ Estimate seems reasonable

### Before Marking Task COMPLETED

**Mandatory Checks**:
- ✅ All acceptance criteria checked off
- ✅ Code compiles with zero errors (Go)
- ✅ All tests passing
- ✅ Code coverage meets minimum (80% backend)
- ✅ `npm run type-check` shows 0 errors (frontend tasks)
- ✅ Runtime verification completed (frontend tasks)
- ✅ API endpoint verification completed (backend tasks)
- ✅ Feature AI.md file updated
- ✅ Security considerations addressed
- ✅ No hardcoded secrets
- ✅ Error handling implemented

## Feature AI.md Maintenance

**CRITICAL**: When working on any feature, you MUST update its contextual AI.md file.

### When to Update

Update feature AI.md whenever task work involves:
1. **New/Modified Endpoints** → Update API Endpoints section
2. **Database Changes** → Update Database Schema section
3. **New UI Components** → Update UI Components section
4. **Dependency Changes** → Update Dependencies section
5. **Acceptance Criteria Complete** → Check off criteria
6. **Bug Fixes** → Update Known Issues section

### Red Flags

⚠️ Feature AI.md is out of date if:
- File paths referenced don't exist
- API endpoints documented aren't in routes
- Acceptance criteria don't match task status
- Last updated >3 months ago
- Known issues reference resolved bugs

## Dependencies Management

### Dependency Types

1. **Sequential Dependencies**: Must complete TASK-A before starting TASK-B
2. **Parallel Dependencies**: Can work simultaneously but must integrate
3. **External Dependencies**: Waiting on third-party library, hardware, etc.

## Common Pitfalls

### ❌ Avoid These Mistakes

1. **Skipping Tests**: "I'll add tests later" → Tests never get added
2. **Vague Acceptance Criteria**: "Make it work" → No clear definition of done
3. **Optimistic Estimates**: "This should take 2 hours" → Takes 8 hours
4. **Forgetting Documentation**: Code complete, AI.md outdated
5. **Premature Completion**: Checking off criteria before full verification
6. **Ignoring Quality Gates**: "It compiles, ship it" → Runtime errors in production
7. **Large Task Scope Creep**: "Just one more small thing" → 40h task becomes 80h

### ✅ Best Practices

1. **Test-Driven Development**: Write tests first, then implementation
2. **Progressive Quality Gates**: Verify continuously, not just at completion
3. **Update Documentation With Code**: Same commit, same PR
4. **Break Down Large Tasks**: >24h? Split into focused tasks
5. **Clear Communication**: Status comments, blocker documentation
6. **Realistic Estimates**: Use historical data, include buffers
7. **Close Large Tasks**: Don't let tasks drag on indefinitely

## Task Templates

### Backend Feature Template

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
- [ ] Repository layer implemented with interfaces
- [ ] Service layer implemented with tests (80%+ coverage)
- [ ] Handler layer implemented with standardized JSON response
- [ ] All endpoints verified via Postman/curl
- [ ] Feature AI.md updated

## Implementation Plan

### Database Schema
[GORM Structs]

### Business Logic
- Repository: [files]
- Service: [files]
- Handler: [files]

### API Endpoints
- `POST /api/v1/endpoint` - Description

## Testing Approach
- Unit tests: Business logic validation (`testify/mock`)
- Integration tests: API endpoint verification

## Estimate
**Hours**: XX

## Dependencies
- Database structure
- JWT Authentication middleware

## Definition of Done
- [ ] 80%+ test coverage
- [ ] All endpoints verified
- [ ] Feature AI.md updated
```

### Frontend Feature Template

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
- [ ] Page/component designed using ONLY design system components
- [ ] State management implemented with Zustand/TanStack Query
- [ ] Real API integration (no mock data) via services
- [ ] Error handling mapped via errorMapper.ts
- [ ] Glassmorphism UI and Skeleton Loading implemented
- [ ] `npm run type-check` shows 0 errors
- [ ] Runtime verification completed
- [ ] Feature AI.md updated

## Implementation Plan

### UI Components
- Pages: [list]
- Components: [list]
- State Stores: [list]

### Design System Components Used
- AppButton
- AppTextField
- AppDataTable
[etc.]

## Testing Approach
- Playwright E2E testing for user flows
- Runtime verification: Navigate all pages with all data scenarios

## Estimate
**Hours**: XX

## Dependencies
- Design system components
- Backend API endpoints (BFF)

## Definition of Done
- [ ] Type-check passes
- [ ] Runtime verification complete
- [ ] Design system compliant
- [ ] Feature AI.md updated
```

## Getting Help

### Task Management Questions

**Where to find information**:
1. This AI.md (task lifecycle, structure, templates)
2. `.gemini/ARCHITECTURE.md` (architecture system, delegation)
3. `AI.md` (quick reference, essential rules)
4. Feature AI.md files (feature-specific context)

### Agent Support

**Use specialized agents for**:
- `@dapen-backend` - Go/Gin development
- `@dapen-frontend` - React/Vite development
- `@dapen-qa` - E2E Playwright testing

---

**Last Updated**: [CURRENT DATE]
