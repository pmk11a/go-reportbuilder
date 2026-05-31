.PHONY: dev build run migrate seed db-init check check-backend check-errors check-warnings

dev:
	@echo "Starting backend with Air (Hot Reload)..."
	@$$(go env GOPATH)/bin/air

build:
	@echo "Building backend..."
	@go build -o main ./cmd/main.go

run: build
	@echo "Running backend..."
	@./main

migrate:
	@echo "Running database migration..."
	@go run ./cmd/main.go --migrate

seed:
	@echo "Running initial data seeder..."
	@go run ./cmd/main.go --seed

db-init:
	@echo "Running database migration and seeder sequentially..."
	@go run ./cmd/main.go --migrate --seed

## ── Quality Gates ────────────────────────────────────────────────────────────
## Run ALL checks: build + vet + tests + coverage (backend only)
check-backend:
	@echo "Running backend quality checks → logs written to ../tmp/"
	@../scripts/check-all.sh --backend-only

## Quick read: show all errors collected in tmp/ at once
check-errors:
	@echo "═══ ERRORS ═══"
	@cat ../tmp/*_errors.log 2>/dev/null | grep -v '^$$' || echo "(no error logs found)"

## Quick read: show all warnings collected in tmp/ at once
check-warnings:
	@echo "═══ WARNINGS ═══"
	@cat ../tmp/*_warnings.log 2>/dev/null | grep -v '^$$' || echo "(no warning logs found)"

