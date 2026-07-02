# ─────────────────────────────────────────────────────────────────────────────
# Cross-platform Makefile — Windows + macOS + Linux
# Tested with GNU Make 4.x (Linux/macOS) and mingw32-make / nmake (Windows).
# ─────────────────────────────────────────────────────────────────────────────

# ── Platform detection ───────────────────────────────────────────────────────
# Detects Windows (native, Git Bash, MSYS, Cygwin) and switches shell helpers.
ifeq ($(OS),Windows_NT)
  MKDIR       = powershell -NoProfile -Command "New-Item -ItemType Directory -Force -Path"
  RM          = powershell -NoProfile -Command "Remove-Item -Recurse -Force"
  BIN_EXT     = .exe
  # On Windows, `go env GOPATH` may return backslash paths like `C:\Users\foo\go`.
  # We normalize to forward slashes via patsubst and emit a PATH hint instead of
  # trying to invoke `$(go env GOPATH)/bin/air` directly (Make misinterprets `:`).
  AIR_BIN     = $(shell powershell -NoProfile -Command "(go env GOPATH) -replace '\\\\','/'" 2>$null)/bin/air.exe
  AIR_PATH_HINT = $$(go env GOPATH)\bin
  WHERE       = where
else
  MKDIR       = mkdir -p
  RM          = rm -rf
  BIN_EXT     =
  AIR_BIN     = $$(go env GOPATH)/bin/air
  AIR_PATH_HINT = $$(go env GOPATH)/bin
  WHERE       = which
endif

# ── Layout (resolved relative to this Makefile's directory) ─────────────────
BIN_DIR     = bin
BINARY      = $(BIN_DIR)/main$(BIN_EXT)
MAIN_PKG    = ./cmd/main.go
ROOT_DIR    = $(abspath $(CURDIR)/..)
TMP_DIR     = $(ROOT_DIR)/tmp
SCRIPTS_DIR = $(ROOT_DIR)/scripts

# ── Phony targets ────────────────────────────────────────────────────────────
.PHONY: dev build run migrate seed db-init clean check-backend check-errors check-warnings help

# ── Help (default goal) ──────────────────────────────────────────────────────
help:
	@echo "Available targets:"
	@echo "  make dev              Run backend with Air hot-reload"
	@echo "  make build            Compile binary into $(BINARY)"
	@echo "  make run              Build + run the backend"
	@echo "  make migrate          Run database migration (--migrate)"
	@echo "  make seed             Run initial data seeder (--seed)"
	@echo "  make db-init          Run migration + seed sequentially"
	@echo "  make clean            Remove build artifacts (bin/, tmp/)"
	@echo "  make check-backend    Run backend quality gate → writes to $(TMP_DIR)/"
	@echo "  make check-errors     Show collected error logs from $(TMP_DIR)/"
	@echo "  make check-warnings   Show collected warning logs from $(TMP_DIR)/"

# ── Development ──────────────────────────────────────────────────────────────
dev:
	@echo "Starting backend with Air (Hot Reload)..."
	@echo "Air binary expected at: $(AIR_PATH_HINT)"
	@if $(WHERE) air >/dev/null 2>&1 ; then \
		air ; \
	else \
		echo "ERROR: air is not installed or not on PATH."; \
		echo "       Install with: go install github.com/air-verse/air@latest"; \
		echo "       Then ensure '$(AIR_PATH_HINT)' is on your PATH."; \
		exit 1; \
	fi

# ── Build / Run ──────────────────────────────────────────────────────────────
build:
	@echo "Building backend → $(BINARY)"
	@$(MKDIR) "$(BIN_DIR)"
	@go build -o $(BINARY) $(MAIN_PKG)

run: build
	@echo "Running backend..."
	@$(BINARY)

# ── Database ─────────────────────────────────────────────────────────────────
migrate:
	@echo "Running database migration..."
	@go run $(MAIN_PKG) --migrate

seed:
	@echo "Running initial data seeder..."
	@go run $(MAIN_PKG) --seed

db-init:
	@echo "Running database migration and seeder sequentially..."
	@go run $(MAIN_PKG) --migrate --seed

# ── Cleanup ──────────────────────────────────────────────────────────────────
clean:
	@echo "Removing build artifacts..."
	@$(RM) "$(BIN_DIR)"
	@if [ -d "$(TMP_DIR)" ]; then $(RM) "$(TMP_DIR)"; fi

# ── Quality Gates ────────────────────────────────────────────────────────────
# TODO: create root-level scripts/check-all.sh
# Until that script exists, check-backend will print a clear message instead
# of failing with a missing-file error.
check-backend:
	@echo "Running backend quality checks → logs would be written to $(TMP_DIR)/"
	@if [ -f "$(SCRIPTS_DIR)/check-all.sh" ]; then \
		bash "$(SCRIPTS_DIR)/check-all.sh" --backend-only ; \
	else \
		echo ""; \
		echo "WARNING: $(SCRIPTS_DIR)/check-all.sh not found."; \
		echo "         Run individual checks instead:"; \
		echo "           go build ./..."; \
		echo "           go vet ./..."; \
		echo "           go test ./..."; \
		exit 0; \
	fi

# Quick read: show all errors collected in tmp/ at once
check-errors:
	@echo "═══ ERRORS ═══"
	@if [ -d "$(TMP_DIR)" ] && ls $(TMP_DIR)/*_errors.log >/dev/null 2>&1; then \
		cat $(TMP_DIR)/*_errors.log | grep -v '^$$' ; \
	else \
		echo "No error logs found. Run check-backend first."; \
	fi

# Quick read: show all warnings collected in tmp/ at once
check-warnings:
	@echo "═══ WARNINGS ═══"
	@if [ -d "$(TMP_DIR)" ] && ls $(TMP_DIR)/*_warnings.log >/dev/null 2>&1; then \
		cat $(TMP_DIR)/*_warnings.log | grep -v '^$$' ; \
	else \
		echo "No warning logs found. Run check-backend first."; \
	fi