# ⚠️ LEGACY FILE — Superseded by Domain-Based Architecture

This file described the **old layered architecture** (`internal/handlers/` etc.). DAPEN has migrated to **Domain-Based + DDD-Lite + Layered** architecture (see `~/.gemini/ARCHITECTURE.md` and `~/.claude/projects/.../memory/dapen-architecture.md`).

## What replaced this

The handler layer still exists, but is now **scoped per domain**, not global. Each domain has its own `handler.go` next to its `service.go`, `repository.go`, `entity.go`, `dto.go`, and `routes.go`.

Examples of the new layout:
- `internal/identity/user/handler.go` — User CRUD HTTP layer
- `internal/identity/permission/handler.go` — Permission HTTP layer (with per-tab + matrix + export)
- `internal/identity/auth/handler.go` — Auth (login, refresh, change-password) HTTP layer
- `internal/accounting/perkiraan/handler.go` — COA master HTTP layer (TASK-010)
- `internal/reports/permission_report/handler.go` — Cross-domain report HTTP layer

## Responsibilities (unchanged for the layer)

- Handle HTTP requests and responses (Gin framework).
- Parse and validate incoming requests (JSON binding, query params, URL params).
- Call the appropriate Service layer functions.
- Format and send JSON responses or HTTP errors back to the client.
- Use `internal/shared/response/` helpers (e.g., `response.Success(c, "msg", data)`) for all responses.

## Rules (unchanged for the layer)

- NO database queries should be written here.
- NO business logic should be placed here.
- Handler MUST call service, never repository directly.
- Handler MUST NOT import other domains' repositories.
- Validate incoming payload using struct tags (e.g., `binding:"required"`).

## Migration status

The `internal/handlers/` global folder will be DELETED once all domains have been migrated. Track progress in `tasks/` and the plan file.
