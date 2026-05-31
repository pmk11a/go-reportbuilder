<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-001: Backend E2E Testing and API Documentation

## Business Problem
The backend lacks a comprehensive E2E testing framework, leading to manual regression testing overhead. Furthermore, API routes are not documented, causing difficulties for frontend integration and maintenance. A unified documentation standard and testing approach are required.

## Priority: High

## Status
✅ **COMPLETED** - May 31, 2026

## Acceptance Criteria
- [x] Task file created (TASK-001)
- [x] Swagger (swaggo) installed and configured in Go backend
- [x] Swagger route (`/swagger/*any`) registered in `routes.go`
- [x] Swagger annotations added to all existing handlers
- [x] Backend AI.md and .gemini/ARCHITECTURE.md updated with Swagger and E2E rules
- [x] `backend/tests/e2e/` folder created
- [x] Baseline setup utility (`setup_test.go`) implemented
- [x] Initial Auth E2E test (`auth_e2e_test.go`) implemented and passing

## User Stories
**As a Developer**
I want to automatically generate API documentation and run automated E2E tests
So that I can verify backend integrity and integrate the frontend with certainty.

## Implementation Plan
1. Create `TASK-001-backend-e2e-and-api-docs.md`.
2. Update `backend/AI.md` and `.gemini/ARCHITECTURE.md` with new rules.
3. Install swaggo dependencies via `go get`.
4. Modify `routes.go` and `cmd/main.go` to serve Swagger UI.
5. Annotate handlers in `internal/handlers/` and run `swag init`.
6. Create `tests/e2e/setup_test.go` to prepare Gin test environment.
7. Create `tests/e2e/auth_e2e_test.go` and write a baseline login test.

## Testing Approach
- Compile and run API server: verify `/swagger/index.html` loads correctly.
- Execute `go test ./tests/e2e/... -v` and ensure baseline tests pass.

## Estimate
**Hours**: 4

## Dependencies
- Go `swaggo/swag`, `swaggo/gin-swagger`, `swaggo/files` packages
- Go `stretchr/testify` for testing assertions

## Risks & Mitigations
- Swaggo might fail to parse complex generic DTOs. Mitigation: Use simplified wrapper DTOs for Swagger if necessary.
- E2E tests may pollute the database. Mitigation: Assume development DB is used, eventually support SQLite in-memory setup if instructed.

## Definition of Done
- [x] `swag init` successfully generates docs without errors.
- [x] `go test` passes in `tests/e2e/`
- [x] Contextual AI.md files reflect new standards.
