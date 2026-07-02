.PHONY: help dev dev-backend dev-frontend migrate seed db-init build build-backend build-frontend test test-backend test-frontend test-e2e lint type-check format clean air-install dev-air install

SHELL := /bin/sh

ifeq ($(OS),Windows_NT)
	BIN_EXT := .exe
	NULL_DEVICE := nul
else
	BIN_EXT :=
	NULL_DEVICE := /dev/null
endif

# -----------------------------------------------------------------------------
# Help
# -----------------------------------------------------------------------------
help: ## Tampilkan daftar target yang tersedia
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# -----------------------------------------------------------------------------
# Development
# -----------------------------------------------------------------------------
dev-backend: ## Jalankan backend only (blocking)
	@echo "🚀 Starting backend..."
	cd backend && go run ./cmd/main.go

dev-frontend: ## Jalankan frontend only (blocking)
	@echo "🚀 Starting frontend..."
	cd frontend && npm run dev

dev: ## Jalankan backend + frontend concurrently
	@echo "🚀 Starting backend + frontend concurrently..."
ifdef COMSPEC
	@start /B cmd /c "cd backend && go run ./cmd/main.go"
	cd frontend && npm run dev
else
	cd backend && go run ./cmd/main.go & \
	cd frontend && npm run dev
	@wait
endif

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------
migrate: ## Terapkan database migrations
	@echo "📦 Applying migrations..."
	cd backend && go run ./cmd/main.go --migrate

seed: ## Seed data awal ke database
	@echo "🌱 Seeding initial data..."
	cd backend && go run ./cmd/main.go --seed

db-init: ## Setup database fresh (migrate + seed)
	@echo "📦 Setting up database..."
	make migrate
	make seed

# -----------------------------------------------------------------------------
# Build
# -----------------------------------------------------------------------------
build-backend: ## Build backend binary ke backend/bin/
	@echo "🔨 Building backend..."
	cd backend && go build -o bin/main$(BIN_EXT) ./cmd/main.go

build-frontend: ## Build frontend production
	@echo "🔨 Building frontend..."
	cd frontend && npm run build

build: ## Build backend + frontend
	@echo "🔨 Building backend + frontend..."
	make build-backend
	make build-frontend

# -----------------------------------------------------------------------------
# Test
# -----------------------------------------------------------------------------
test-backend: ## Jalankan unit tests Go
	@echo "🧪 Running backend tests..."
	cd backend && go test ./... -v

test-frontend: ## Jalankan unit tests frontend (Vitest)
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test -- --run

test-e2e: ## Jalankan Playwright E2E tests
	@echo "🧪 Running E2E tests..."
	cd frontend && npx playwright test

test: ## Jalankan semua tests
	@echo "🧪 Running all tests..."
	make test-backend
	make test-frontend

# -----------------------------------------------------------------------------
# Lint & Type Check
# -----------------------------------------------------------------------------
lint_backend: ## Go vet static analysis
	@echo "🔍 Linting backend..."
	cd backend && go vet ./...

lint_frontend: ## ESLint untuk frontend
	@echo "🔍 Linting frontend..."
	cd frontend && npm run lint

lint: ## Jalankan linting (backend + frontend)
	@echo "🔍 Linting..."
	make lint_backend
	make lint_frontend

type-check: ## TypeScript type-check frontend
	@echo "🔍 Type-checking frontend..."
	cd frontend && npm run type-check

# -----------------------------------------------------------------------------
# Format
# -----------------------------------------------------------------------------
format: ## Format kode (gofmt + prettier)
	@echo "🎨 Formatting..."
	cd backend && gofmt -w .
	cd frontend && npx prettier --write src/

# -----------------------------------------------------------------------------
# Clean
# -----------------------------------------------------------------------------
clean: ## Hapus build artifacts
	@echo "🧹 Cleaning artifacts..."
	@rm -rf backend/bin
	@rm -rf frontend/dist
	@rm -rf tmp

# -----------------------------------------------------------------------------
# Air (Hot Reload)
# -----------------------------------------------------------------------------
air-install: ## Install Air untuk hot reload backend
	@echo "📥 Installing Air..."
	go install github.com/cosmtrek/air@latest

dev-air: ## Jalankan backend dengan Air hot reload
	@echo "🔥 Starting backend with Air hot reload..."
	cd backend && $(HOME)/go/bin/air$(BIN_EXT)

# -----------------------------------------------------------------------------
# Dependencies
# -----------------------------------------------------------------------------
install: ## Install semua dependencies
	@echo "📥 Installing all dependencies..."
	cd backend && go mod download
	cd frontend && npm install
