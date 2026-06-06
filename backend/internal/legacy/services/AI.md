# ⚠️ LEGACY FILE — Superseded by Domain-Based Architecture

This file described the **old layered architecture** (`internal/legacy/services/` etc.). DAPEN has migrated to **Domain-Based + DDD-Lite + Layered** architecture (see `~/.gemini/ARCHITECTURE.md` and `~/.claude/projects/.../memory/dapen-architecture.md`).

## What replaced this

The service layer still exists, but is now **scoped per domain**, not global. Each domain has its own `service.go` next to its `handler.go`, `repository.go`, `entity.go`, `dto.go`, and `routes.go`.

Examples of the new layout:
- `internal/features/identity/user/service.go` — User business logic
- `internal/features/identity/permission/service.go` — Permission business logic (per-tab reads, transactional updates, matrix generation)
- `internal/features/identity/auth/service.go` — Auth business logic
- `internal/features/menu/service.go` — Master menu business logic
- `internal/accounting/perkiraan/service.go` — COA master business logic (TASK-010)
- `internal/reports/permission_report/service.go` — Cross-domain report business logic

## Responsibilities (unchanged for the layer)

- Contain the core business logic of the application.
- Orchestrate calls to repositories to perform complex operations.
- Handle data formatting, calculations, and business validations.
- May call OTHER DOMAINS' services (NOT their repositories) for inter-domain access.
- Thin pass-through wrappers over repository methods are allowed (e.g., `GetUserMenuPermissions`).

## Rules (unchanged for the layer)

- NO database queries should be written here (use Repositories instead).
- NO HTTP/Gin context should be imported or used here.
- NO direct cross-domain repository access (use other domains' services).
- Service MUST NOT call handler or repository of another domain.
- Business logic lives ONLY in the service layer.

## Migration status

The `internal/legacy/services/` global folder will be DELETED once all domains have been migrated. Track progress in `tasks/` and the plan file.
