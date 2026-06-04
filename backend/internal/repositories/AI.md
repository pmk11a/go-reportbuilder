# ⚠️ LEGACY FILE — Superseded by Domain-Based Architecture

This file described the **old layered architecture** (`internal/repositories/` etc.). DAPEN has migrated to **Domain-Based + DDD-Lite + Layered** architecture (see `~/.gemini/ARCHITECTURE.md` and `~/.claude/projects/.../memory/dapen-architecture.md`).

## What replaced this

The repository layer still exists, but is now **scoped per domain**, not global. Each domain has its own `repository.go` next to its `handler.go`, `service.go`, `entity.go`, `dto.go`, and `routes.go`.

Examples of the new layout:
- `internal/identity/user/repository.go` — User CRUD persistence
- `internal/identity/permission/repository.go` — Per-user menu/report/COA permission persistence (dbflmenu, DBFLMENUREPORT, DBAKSESPERKIRAAN)
- `internal/identity/auth/repository.go` — Auth persistence
- `internal/menu/repository.go` — Master menu catalogue persistence
- `internal/accounting/perkiraan/repository.go` — COA master persistence (TASK-010)
- `internal/reports/permission_report/repository.go` — Cross-domain report persistence

## Responsibilities (unchanged for the layer)

- Handle all database interactions (CRUD operations).
- Interface directly with GORM.
- Encapsulate complex database queries and return clean entity instances or slices.
- Use composite JOINs to bridge per-user tables (e.g., `dbflmenu`) with master tables (e.g., `DBMENU`).

## Rules (unchanged for the layer)

- NO business logic should be placed here.
- NO HTTP/Gin context should be imported or used here.
- Repository MUST NOT call other domains' repositories (use their service).
- Repository MUST NOT call handler or service.
- Hardcode `0 AS <column>` for schema columns that don't exist (document why in a `//` comment).
- Wrap errors with context: `fmt.Errorf("fetching X for %q: %w", id, err)`.

## Migration status

The `internal/repositories/` global folder will be DELETED once all domains have been migrated. Track progress in `tasks/` and the plan file.
