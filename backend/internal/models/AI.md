# ⚠️ LEGACY FILE — Superseded by Domain-Based Architecture

This file described the **old layered architecture** (`internal/models/` etc.). DAPEN has migrated to **Domain-Based + DDD-Lite + Layered** architecture (see `~/.gemini/ARCHITECTURE.md` and `~/.claude/projects/.../memory/dapen-architecture.md`).

## What replaced this

The models layer still exists, but is now **scoped per domain**, not global. Each domain has its own `entity.go` next to its `handler.go`, `service.go`, `repository.go`, `dto.go`, and `routes.go`.

Examples of the new layout:
- `internal/identity/user/entity.go` — `SUser`, `SDBFLPASS`
- `internal/identity/permission/entity.go` — `SUserPermission`, `SUserCoaAccess`, `SPermissionReportRow`
- `internal/identity/auth/entity.go` — Auth entities
- `internal/menu/entity.go` — `SDbMenu`, `SDBMENUREPORT`
- `internal/accounting/perkiraan/entity.go` — `SPerkiraan`, `SDBAKSESPERKIRAAN` (TASK-010)

## Responsibilities (unchanged for the layer)

- Define database schemas and relationships using GORM tags.
- Define `TableName() string` on every GORM model to prevent automatic pluralization.
- Map Go struct field names to legacy SQL Server column names (e.g., `KODEMENU`, `Keterangan`, `HASACCESS`).
- Maintain legacy column-type compatibility (e.g., `size:100` on string indexes for MSSQL).
- Contains NO business logic, NO database queries (those live in repository), and NO HTTP logic.

## Rules (unchanged for the layer)

- Entities MUST implement `TableName() string`.
- Entities MUST NOT be imported in handlers (use DTOs instead).
- Legacy tables MUST NOT have `CreatedAt`/`UpdatedAt` added.
- `AutoMigrate` is FORBIDDEN on legacy tables.

## Migration status

The `internal/models/` global folder will be DELETED once all domains have been migrated. Track progress in `tasks/` and the plan file.
