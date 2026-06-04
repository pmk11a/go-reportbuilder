<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-006: Go Backend Redis Caching

## Business Problem
High-load enterprise environments query the database repeatedly for static or semi-statis tables (e.g., sidebar menus, accounting period configuration, dashboard statistics). Doing so degrades performance, wastes CPU cycles, increases DB load, and increases latency. Implementing a Redis-backed caching layer for read-heavy APIs will drastically reduce endpoint response times from hundreds of milliseconds to under 5ms, enhancing overall user experience and system capacity.

## Priority: High

## Status
✅ **COMPLETED** - June 1, 2026

## Acceptance Criteria
- [x] Implement robust generic Redis caching utilities in backend with serialization/deserialization logic.
- [x] Integrate Redis caching for `GET /api/menus/sidebar` (1-hour cache TTL).
- [x] Integrate Redis caching for `GET /api/dashboard/stats` (5-minute cache TTL).
- [x] Integrate Redis caching for `GET /api/periode` (1-hour cache TTL).
- [x] Implement smart cache invalidation: delete specific caches on data modifications (Create/Update/Delete).
- [x] Support custom bypass header (e.g., `X-Cache-Bypass: true`) for administrative debugging.
- [x] Write unit tests for caching helper methods and handlers achieving >80% test coverage.

## User Stories
**As an enterprise system operator**
I want static or slow API responses cached in a fast in-memory store
So that database load remains low and page loading speeds remain under 50ms.

**As a user**
I want the sidebar and dashboard to load instantly when I navigate between pages
So that the application feels fluid and responsive.

## User Scenarios

### Cache Menu Endpoint
- [x] ✅ PASS: **[Positive] Cache Sidebar Menu**: A user fetches the sidebar menu. The first request is a cache miss and queries the DB, storing the serialized JSON in Redis. The second request is a cache hit, retrieving data from Redis instantly without touching the DB.
- [x] ✅ PASS: **[Positive] Invalidate Menu Cache on Update**: Admin updates a menu item in the database. The system automatically invalidates (deletes) the `menu:sidebar:*` cache. The next request triggers a cache miss and re-fetches fresh data from the DB.

### Cache Dashboard Stats
- [x] ✅ PASS: **[Positive] Cache Dashboard Metrics**: A user logs in and views dashboard statistics. The heavy query results are cached in Redis with a 5-minute TTL. Subsequent requests by the same or other users within 5 minutes retrieve metrics from Redis in <5ms.
- [x] ✅ PASS: **[Edge Case] Cache Bypass Header**: A developer calls `GET /api/dashboard/stats` with `X-Cache-Bypass: true`. The API bypasses Redis cache, queries the database directly, and updates the cache.

## Implementation Plan

### Caching Utility (Backend)
- File: [NEW] `backend/internal/utils/cache.go`
  - Implement helper functions for Redis cache management (Get/Set/Delete) with support for GOB/JSON encoding.

### Handlers Refactoring
- File: [MODIFY] `backend/internal/handlers/menu_handler.go`
  - Fetch sidebar menu using cache manager.
- File: [MODIFY] `backend/internal/handlers/dashboard_handler.go`
  - Fetch stats using cache manager.
- File: [MODIFY] `backend/internal/handlers/periode_handler.go`
  - Fetch active periode using cache manager.

### Invalidation Logic (Services / Repositories)
- File: [MODIFY] `backend/internal/services/menu_service.go` or `backend/internal/repositories/menu_repository.go`
  - Trigger key deletion when menu structure is modified.

## Testing Approach
- **Unit Tests**:
  - Mock Redis client and test cache helpers.
  - Assert that handler calls hit Redis client and return correct responses.
  - Path: `backend/internal/utils/cache_test.go` and updated handler tests.
- **Integration Tests**:
  - E2E test verifying cache hits/misses using simulated latency or query counters.

## Estimate
**Hours**: 12

## Dependencies
- `backend/internal/db/redis.go` (Active Redis client)

## Risks & Mitigations
- **Risk**: Stale data displays on client side if cache is not properly invalidated.
- **Mitigation**: Implement robust and strict invalidation hooks in GORM repository/service layers for every mutation operation.

## Definition of Done
- [x] All acceptance criteria met
- [x] Type-check passes on both frontend and backend
- [x] Unit tests written and coverage exceeds 80% for new utility code
- [x] Feature AI.md updated to document backend caching behavior and keys used
