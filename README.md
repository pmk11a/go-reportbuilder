# DAPEN - Full-Stack Application

A modern full-stack web application built with **TanStack Start** (Frontend) and **Golang** (Backend), featuring a comprehensive design system, BFF-style server functions, and SQL Server + Redis data layer.

## 📋 Overview

DAPEN is a scalable, feature-rich application with:

- **Frontend**: React 19 + TanStack Start (SSR + Server Functions) — Vite-based, no Next.js
- **Backend**: RESTful API with Go 1.25 + Gin + GORM + SQL Server + Redis
- **Architecture**: Server Functions (TanStack Start) for BFF, JWT in Redis sessions
- **State**: TanStack Query (server) + Zustand (client)
- **Tooling**: Vite, Tailwind v4, swaggo for OpenAPI
- **Domain-Based Backend**: `handler → service → repository → entity` per domain

## 🏗️ Project Structure

```
dapen-golang-next/
├── Makefile                 # Cross-platform dev workflow (Windows + Unix)
├── Taskfile.yml             # Modern alternative to Makefile
├── README.md                # This file
├── .air.toml                # Hot reload config
├── backend/
│   ├── Makefile             # Backend-only convenience targets
│   ├── cmd/                 # main.go entry point (--migrate, --seed flags)
│   ├── internal/
│   │   ├── shared/          # Technical concerns (auth, cache, response, middleware)
│   │   ├── features/        # Domain modules (activity, dashboard, identity, ...)
│   │   └── infrastructure/  # DB, Redis, config
│   └── go.mod
└── frontend/
    ├── package.json
    └── src/
        ├── server/          # Server functions (createServerFn), middleware, session
        ├── routes/          # TanStack Router (file-based)
        ├── components/      # UI (base → shared → module)
        ├── hooks/           # TanStack Query hooks
        ├── services/        # Service layer
        ├── store/           # Zustand state
        ├── types/           # Centralized types
        └── utils/           # errorMapper, helpers
```

## 🚀 Quick Start

### Prerequisites

- **Go** 1.25+
- **Node.js** 20+ LTS & **npm** 10+
- **SQL Server** 2019+ (Express OK)
- **Redis** 6+
- **Git**
- **GNU Make** OR **Task** (for cross-platform dev workflow)

### ⚡ Fastest Setup (using Make / Task)

From project root:

```bash
# Install all deps (backend Go modules + frontend npm packages)
make install            # or: task install

# Initialize database (migrate + seed)
make db-init            # or: task db:init

# Run dev server (backend + frontend together)
make dev                # or: task dev

# Backend only:
make dev-backend        # or: task dev:backend
# Open http://localhost:8080

# Frontend only:
make dev-frontend       # or: task dev:frontend
# Open http://localhost:3000
```

### 🛠️ Manual Setup

#### Backend

```bash
cd backend
go mod download
go run ./cmd/main.go                # Start server
go run ./cmd/main.go --migrate      # Apply migrations
go run ./cmd/main.go --seed         # Seed initial data
go run ./cmd/main.go --migrate --seed  # Both
```

Server runs at `http://localhost:8080`.

#### Frontend

```bash
cd frontend
npm install
npm run dev       # Vite dev server
npm run build     # Production build
npm test          # Vitest unit tests
```

App runs at `http://localhost:3000`.

---

## 🪟 Windows Setup

Windows natively lacks GNU Make and most Unix utilities. Two paths to get cross-platform dev workflow:

### Option 1: GNU Make (Recommended)

Install via your favorite package manager:

```powershell
# Chocolatey (recommended)
choco install make

# winget
winget install GnuWin32.Make
# or
winget install ezwinports.make

# Scoop
scoop install make
```

Verify: `make --version`

### Option 2: Task (Modern Alternative — Easier Install)

[Task](https://taskfile.dev/) is a single binary, cross-platform by default:

```powershell
# Via Go
go install github.com/go-task/task/v3/cmd/task@latest

# Via Chocolatey
choco install go-task

# Via Scoop
scoop install task

# Via winget
winget install Task.Task

# Manual: download from https://github.com/go-task/task/releases
# Add the extracted `task.exe` to your PATH
```

Verify: `task --version`

### Backend Prerequisites (Windows)

1. **Go 1.25+** — download MSI from https://go.dev/dl/
   - Add `%USERPROFILE%\go\bin` to your PATH
   - Set `GOPATH` environment variable (default: `%USERPROFILE%\go`)
2. **SQL Server** — install SQL Server 2019 Express, or run via Docker:
   ```powershell
   docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong!Passw0rd" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2019-latest
   ```
3. **Redis** — install via:
   ```powershell
   choco install redis-64
   # or
   docker run -d -p 6379:6379 redis:latest
   ```

### Frontend Prerequisites (Windows)

1. **Node.js 20+ LTS** — download from https://nodejs.org/ (Windows Installer `.msi`)
2. **npm** — bundled with Node.js

### Hot Reload (Air) — Optional

```powershell
go install github.com/cosmtrek/air@latest
```

Binary installed at `%USERPROFILE%\go\bin\air.exe` and the Makefile resolves this path automatically via `$(GOPATH)/bin/air`.

### Path Conventions on Windows

- The provided `Makefile` uses forward slashes (`/`) internally, which Go's `filepath.Join` accepts on Windows.
- `os/exec` calls work cross-platform.
- PowerShell output redirection uses `>` (same as bash).

### Running on Windows (After Setup)

Open PowerShell or Windows Terminal from project root:

```powershell
make install          # or: task install
make db-init          # or: task db:init
make dev              # or: task dev
```

---

## 🍎🐧 macOS / Linux Setup

Most tools are pre-installed or one `brew install` / `apt install` away:

```bash
# macOS (Homebrew)
brew install go node sqlserver redis

# Ubuntu/Debian
sudo apt install golang-go nodejs npm redis-server
```

`make` is pre-installed on most Linux distros and Xcode Command Line Tools on macOS.

---

## 📚 Available Commands

Run `make help` or `task --list` for the full list. Common targets:

| Target | Description |
|---|---|
| `make dev` / `task dev` | Run backend + frontend concurrently |
| `make dev-backend` | Backend only (`go run ./cmd/main.go`) |
| `make dev-frontend` | Frontend only (`npm run dev`) |
| `make migrate` | Apply DB migrations |
| `make seed` | Seed initial data |
| `make db-init` | Migrate + seed |
| `make build` | Build backend binary + frontend bundle |
| `make test` | Run all tests (Go + Vitest) |
| `make test-e2e` | Playwright E2E |
| `make lint` | `go vet` + ESLint |
| `make type-check` | TypeScript `tsc --noEmit` |
| `make format` | `gofmt` + `prettier` |
| `make clean` | Remove `bin/`, `dist/`, `tmp/` |
| `make air-install` | Install Air for hot reload |
| `make help` | List all targets |

The `Makefile` and `Taskfile.yml` are designed to be **identical in behavior** on macOS, Linux, and Windows. Choose whichever you prefer.

---

## 🧪 Testing

```bash
# Backend unit tests
make test-backend          # or: cd backend && go test ./... -v

# Frontend unit tests (Vitest)
make test-frontend         # or: cd frontend && npm test -- --run

# E2E tests (Playwright)
make test-e2e              # or: cd frontend && npx playwright test
```

---

## 🚢 Production Build

```bash
# Backend binary
make build-backend
# Output: backend/bin/main (or main.exe on Windows)

# Frontend bundle
make build-frontend
# Output: frontend/dist/

# Cross-compile backend for Linux from any host:
cd backend && GOOS=linux GOARCH=amd64 go build -o bin/dapen-backend ./cmd/main.go
```

---

## 🔧 Troubleshooting

### `make: command not found` (Windows)

Install GNU Make via Chocolatey: `choco install make`. Or use Task instead.

### `air: command not found` (Windows)

Run `make air-install` (or `task air:install`). Air will be installed at `%USERPROFILE%\go\bin\air.exe`. Add `%USERPROFILE%\go\bin` to PATH if not already.

### Backend won't connect to SQL Server

- Verify SQL Server is running: `docker ps` (if using Docker) or check Services.
- Confirm connection string in `backend/.env` (e.g., `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`).
- For SQL Server Express on Windows, default port is `1433`.

### Port conflicts

- Backend default: `:8080`. Override with `PORT=8081 make dev-backend`.
- Frontend default: `:3000`. Override via `npm run dev -- --port 3001`.

### Path issues on Windows

If you see errors with backslashes, ensure:
1. You're running `make` from PowerShell or Windows Terminal (not legacy CMD).
2. `GOPATH` is set as a Windows env var (not Unix-style).

---

## 📖 Architecture & Conventions

See [`CLAUDE.md`](./CLAUDE.md) for the complete architecture documentation including:
- Backend Domain-Based + DDD-Lite + Layered pattern
- Frontend Strict Separation of Concerns
- Server Functions pattern
- Database migration strategy
- Caching & rate limiting rules
- Quality gate workflow

---

## 🤝 Contributing

1. Use Go idioms for backend, TypeScript for frontend
2. Follow the existing domain-based architecture
3. Add tests for any new feature
4. Run `make test && make lint && make type-check` before committing
5. Update the relevant `CLAUDE.md` in the same commit

---

## 📄 License

Internal project — DAPEN application.

---

**Last Updated**: July 2, 2026
**Current Version**: 1.0.0
**Status**: Active Development 🚀

For detailed information, see:
- [Project Architecture (CLAUDE.md)](./CLAUDE.md)
- [Backend Documentation](backend/CLAUDE.md)
- [Frontend Documentation](frontend/CLAUDE.md)