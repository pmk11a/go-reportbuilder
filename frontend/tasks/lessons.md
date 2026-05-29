# Lessons Learned

## General
- Always follow the `standard-md-claude.md` workflow.
- Maintain professional code patterns (Clean Arch for Go, Modular for React).

## Backend (Go)
- Clean Architecture provides a clear separation of concerns (Models -> Repositories -> Services -> Handlers).
- Dependency Injection via constructors ensures testability and loose coupling.

## Frontend (React + TanStack)
- BFF (Backend For Frontend) pattern in `services/` simplifies data handling in components.
- TanStack ecosystem (Router + Query) provides a powerful, type-safe foundation for SPA development.
