# AI.md - Backend Quick Reference

> **Global Rule**: Always refer to `../.gemini/ARCHITECTURE.md` for major architectural patterns.

## 🎯 Backend Focus (Golang, Gin, Clean Architecture)

The `backend/` workspace controls SQL Server database queries via GORM, business logic, JWT security, and standard Rest APIs.
The primary work in this area is always assigned to: **`@dapen-backend`**

### 📋 Mandatory Backend Checklist
- [ ] Layered Clean Architecture rules are enforced: `handlers/` -> `services/` -> `repositories/`.
- [ ] Database Table Models *only* exist in `models/` and JSON Structs *only* exist in `dto/`.
- [ ] Use Dependency Injection via Interfaces (Starting with `I`).
- [ ] Struct and Handler naming starts with `S` (e.g., `SUser`).
- [ ] All protected routes are secured using `middleware.AuthMiddleware()`.
- [ ] Responses are always standardized via utility functions, e.g., `utils.Success(...)`.
- [ ] **API Documentation**: EVERY endpoint (existing or new) MUST have Swagger annotations (Swaggo) above its handler function, and `swag init` must be run.
- [ ] `Unit Tests` are written for `services/` using Mocking methods (using *mockery/testify*).
- [ ] `E2E Tests` are written in `tests/e2e/` using `httptest` to test the full router layer without mocking.

## 📂 Main Backend Structure

```
backend/
├── cmd/
│   └── main.go           # Entry point & Initializer
├── internal/
│   ├── config/           # Loader for `.env` file
│   ├── db/               # Database Initialization (GORM) & CLI Migration
│   ├── dto/              # Request/Response Structs (HTTP JSON Payloads)
│   ├── handlers/         # HTTP Controllers, Receives Gin Context
│   ├── middleware/       # Authentication, Logging, Timeout, Rate Limiting
│   ├── models/           # Domain Layer (Pure GORM SQL Structs)
│   ├── repositories/     # Data Layer (SQL Server Queries via GORM)
│   ├── routes/           # Registers routes from Handlers
│   ├── services/         # Core Business Logic Rules Layer
│   └── utils/            # Helpers (e.g., standard HTTP response builder)
```

## ⚡ Quick Commands

Run the backend server normally:
```bash
go run cmd/main.go
```

Run Database Migration (AutoMigrate New Tables):
```bash
go run cmd/main.go --migrate
```

Run Initial Data Seeder:
```bash
go run cmd/main.go --seed
```

Run Unit Tests across all files:
```bash
go test ./... -v
```
