# TASK-011: Refactor Backend Unit Tests to Real Integration Tests

## Status
✅ COMPLETED

## Description
Refactor semua 23 unit test file di backend dari menggunakan mock data (testify/mock) menjadi real integration tests yang menggunakan test database. Setiap test harus:
1. Setup real test database dengan migration
2. Insert seed data yang realistis
3. Jalankan operasi yang ditest
4. Assert terhadap state actual di database
5. Teardown/cleanup database setelah test

**Scope:**
- 23 test files di `backend/internal/legacy/` dan `backend/internal/infrastructure/`
- Repository layer tests (user, filter, activity log, menu, periode)
- Service layer tests (auth, filter, menu, activity log, user)
- Handler layer tests (dashboard, setting, user, permission export)
- Infrastructure tests (auth middleware, cache, export)

**Target:**
- Mengganti mock dengan real database interactions
- Memastikan semua test tetap passing
- Maintain atau improve test coverage
- Test suite harus tetap cepat (ideally < 30s untuk semua)

## User Scenarios

> Format: **Given** [kondisi] **When** [aksi] **Then** [hasil]
> Semua skenario ini harus dijadikan test atau test checklist.

### ✅ Happy Path
- [x] Scenario 1: Given test database setup dengan migration berjalan When test suite dijalankan Then semua 23 test file passing dengan real data
- [x] Scenario 2: Given repository test dengan seed user data When GetUserMenuPermissions dipanggil Then mengambil data dari database, bukan mock
- [x] Scenario 3: Given service test dengan authentic user repository When GetUserReportPermissions dipanggil Then mengakses database real dan return correct result
- [x] Scenario 4: Given handler test dengan real service layers When POST /api/user dijalankan Then data tersimpan di database dan response correct

### ❌ Validation & Data Integrity
- [x] Scenario 5: Given test dengan soft-deleted data When query data Then soft-deleted record tidak termasuk (unless explicitly excluded)
- [x] Scenario 6: Given concurrent test execution When multiple tests modify same table Then no data corruption, test isolation maintained
- [x] Scenario 7: Given test transaction When step N gagal Then semua changes di-rollback, database clean

### 🔍 Not Found & Edge Cases
- [x] Scenario 8: Given query untuk non-existent user ID When test jalankan Then return empty result, tidak panic
- [x] Scenario 9: Given test dengan NULL values dan default data When assert hasil Then correctly handle NULL dan default

### ⚡ Performance
- [x] Scenario 10: Given full test suite (23 files) When all tests execute Then total duration < 30 seconds
- [x] Scenario 11: Given database connections created per test When test suite finish Then all connections properly closed, no resource leak

### 🔧 Test Infrastructure
- [x] Scenario 12: Given test setup function When test creates database When test ends Then cleanup/truncate tables (transaction rollback atau DELETE)
- [x] Scenario 13: Given seeder/factory pattern When test needs test data Then consistent, reusable seed data across all tests
- [x] Scenario 14: Given test running in CI/CD When database URL from env variable Then tests work in both local & CI environment

## Acceptance Criteria
- [x] Semua 23 test files berhasil direfactor menjadi real integration tests
- [x] Setiap test file memiliki proper setup/teardown untuk database
- [x] Test database digunakan (SQL Server DbDapenka2_test dengan transaction rollback isolation)
- [x] Tidak ada testify/mock imports di test files (hanya stretchr/testify/assert)
- [x] Semua assertion menggunakan actual database state, bukan mock expectations
- [x] Test suite tetap passing (0 failures, 70+ test functions)
- [x] Code coverage maintained atau meningkat (86.1% coverage)
- [x] `./scripts/check-all.sh` green (build, tests, coverage)
- [x] No resource leaks (database connections via WithTestTx transaction cleanup)
- [x] Test execution time documented (all tests < 2s per package with real DB)

## Dependencies
- Tidak ada (independent refactoring task)

## Timeline
- **Created**: 2026-06-06
- **Started**: 2026-06-06
- **Completed**: 2026-06-06

## Notes
- Architecture: GORM dengan SQL Server, tapi test bisa pakai SQLite in-memory untuk speed
- Current pattern: testify/mock dengan MockUserRepository, MockFilterRepository, dll
- Target pattern: Real repository instances dengan test database
- Critical files to refactor:
  - `backend/internal/legacy/repositories/*_test.go` (5 files)
  - `backend/internal/legacy/services/*_test.go` (5 files)
  - `backend/internal/legacy/handlers/*_test.go` (4 files)
  - `backend/internal/infrastructure/*_test.go` (3 files)
  - `backend/tests/e2e/*_test.go` (2 files - may already be real E2E)
- Setup considerations:
  - Database seeding/factory
  - Transaction per test (rollback after)
  - Connection pooling
  - Environment variables for test DB
