.PHONY: dev build run migrate seed db-init

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


