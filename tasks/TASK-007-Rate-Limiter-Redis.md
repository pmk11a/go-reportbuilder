<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-007: Redis-Backed Rate Limiter & BFF Optimization

## Business Problem
The current backend per-IP rate limiter uses an in-memory `sync.Map` with no expiration mechanism. In production, this causes a gradual **memory leak** as unique client IPs accumulate indefinitely. Furthermore, in-memory rate limiting fails in multi-instance horizontal-scaling environments because counts are not shared. At the same time, the frontend BFF rate limiter has a potential **race condition** since its increment (`INCR`) and expire (`EXPIRE`) operations are not atomic. Translating the backend rate limiter to a Redis-backed model and optimizing the BFF rate limiter with atomic Lua scripting will resolve memory leaks, ensure reliable multi-instance sync, and eliminate race conditions.

## Priority: Medium

## Status
✅ **COMPLETED** - June 1, 2026

## Acceptance Criteria
- [x] Implement an active cleanup background worker in the backend's in-memory rate limiter to evict inactive IPs and fix the memory leak.
- [x] Create a new Redis-backed backend rate limiter middleware utilizing redis hash/string counters with dynamic sliding or fixed windows.
- [x] Refactor BFF rate limiter (`rate-limit.ts`) to use an atomic Redis Lua script to solve the non-atomic race condition.
- [x] Add configuration support to easily switch the backend rate limiter between `in-memory` (for single-server Dev) and `redis` (for multi-server Prod).
- [x] Ensure that both rate limiters (BFF & backend) return standardized HTTP headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`).
- [x] Achieve 80%+ test coverage for the updated rate limiting middleware on the Go backend and Node BFF.

## User Stories
**As a platform engineer**
I want rate limiters to run in Redis and clean up inactive IPs
So that the server doesn't suffer memory leaks and scales horizontally without sharing issues.

**As a security auditor**
I want rate limiting checks to be fully atomic and consistent
So that malicious actors cannot bypass limits using high-concurrency race conditions.

## User Scenarios

### In-Memory rate limiter Cleanup
- [x] ✅ PASS: **[Positive] Evict Inactive Client IPs**: Multiple users access the backend. Their IPs are added to the in-memory limiter map. After 10 minutes of inactivity, the cleanup worker successfully evicts these inactive entries, freeing system memory.

### Redis-Backed Backend Rate Limiter
- [x] ✅ PASS: **[Positive] Redis-Backed Rate Limiting**: The system is set to use the Redis-backed rate limiter. A user issues high-frequency requests. Redis tracks the IP requests correctly, blocking the user with HTTP 429 when the limit is exceeded.
- [x] ✅ PASS: **[Positive] Consistent Headers**: Under rate limit, the API returns custom header info indicating the total limit, remaining requests, and reset time window.

### Atomic BFF Rate Limiter
- [x] ✅ PASS: **[Positive] Atomic Increment & Expire**: Multiple concurrent requests hit the BFF at the exact same millisecond. The atomic Lua script ensures that the rate limit count is incremented and expiration is set correctly, with no keys left without a TTL.

## Implementation Plan

### Go Backend Rate Limiter Fixes & Redis Option
- File: [MODIFY] `backend/internal/middleware/security.go`
  - Add `startCleanup()` worker inside `NewIPBasedLimiter` to evict entries whose tokens have been fully restored.
  - Implement a new `RedisIPBasedLimiter` struct that uses `db.RedisClient` for tracking.
  - Update `RateLimitMiddleware` to support configuration-based backend selection.

### BFF Rate Limiter Optimization
- File: [MODIFY] `frontend/src/bff/rate-limit.ts`
  - Write and evaluate a Lua script using `redis.eval()` to atomically execute `INCR` + `EXPIRE` only on first hit.

## Testing Approach
- **Unit Tests**:
  - Test the Go backend in-memory cleanup routine by mocking time/tokens.
  - Test the Go Redis rate limiter with a mock Redis client.
  - Unit tests for the BFF rate-limiting utility and Lua script wrapper.
- **Integration Tests**:
  - Run continuous high-frequency requests to verify rate limits and header accuracy.

## Estimate
**Hours**: 10

## Dependencies
- `backend/internal/db/redis.go` (Active Redis client)
- `frontend/src/bff/redis.ts` (Active BFF Redis client)

## Risks & Mitigations
- **Risk**: Redis failure could block all traffic if the rate limiter throws an unhandled error.
- **Mitigation**: Implement "Fail-Open" logic. If the Redis client is unreachable, log an error but let requests pass through rather than blocking the application.

## Definition of Done
- [x] Memory leaks verified as resolved via continuous testing or profiling simulations
- [x] Atomic Lua script verified with 0 stranded keys (keys without TTL)
- [x] 80%+ unit/integration test coverage achieved
- [x] AI.md / feature documentation updated
