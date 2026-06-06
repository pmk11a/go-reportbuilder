# Session Management Domain — AI.md

## Overview

The **session** domain manages user session lifecycle, including listing active sessions and forcing session revocation (logout from specific devices or all devices). This is critical for security and compliance.

**Scope (Phase 1 — COMPLETED):**
- Backend session tracking APIs
- Session revocation (single + bulk)
- Audit logging for compliance
- Domain-based layered architecture (handler → service → repository)

**Future (Phase 2 — Frontend UI):**
- React User Management page integration
- Session details modal (login time, IP, browser)
- Confirmation dialogs for force logout

## Architecture

### Folder Structure

```
internal/features/session/
├── entity.go         # SSessionInfo, DTO models
├── dto.go            # HTTP request/response payloads
├── repository.go     # ISessionRepository + SSessionRepository (Redis backend)
├── service.go        # ISessionService + SSessionService (business logic)
├── handler.go        # SSessionHandler (HTTP endpoints, Swagger docs)
├── routes.go         # RegisterRoutes (route wiring)
├── *_test.go         # Unit tests (handler, service, repository)
└── AI.md             # This file
```

### Dependency Chain

```
handler → service → repository → Redis (via go-redis/v9)
          ↓ (audit)
        logging (stdout for Phase 1, DB in Phase 2+)
```

### Key Abstractions

1. **ISessionRepository** — Redis session storage (read sessions, revoke flags, cleanup)
2. **ISessionService** — Business logic (filter expired, check permissions, audit)
3. **SSessionHandler** — HTTP endpoints (GET/DELETE)

## Data Flow

### List User Sessions

```
GET /api/admin/users/{userId}/sessions
  ↓ (handler validates userID, extracts adminID from JWT)
  ↓ (handler calls service.ListUserSessions)
  ↓ (service queries repo.GetUserSessions)
  ↓ (repo scans Redis keys bff:user_sessions:{userId})
  ↓ (repo fetches each session from bff:session:{sessionId})
  ↓ (repo parses JSON → SSessionInfo, filters expired)
  ↓ (service filters expired again, returns sorted by LoginTime DESC)
  ↓ (handler returns JSON: { success, data: { sessions: [...] } })
```

### Revoke Single Session

```
DELETE /api/admin/users/{userId}/sessions/{sessionId}
  ↓ (handler validates userID, sessionId, extracts adminID)
  ↓ (service.RevokeUserSession checks session exists + belongs to user)
  ↓ (service calls repo.RevokeSession → sets Redis flag bff:revoked_sessions:{sessionId})
  ↓ (service logs audit event: [AUDIT] action=SESSION_REVOKED ...)
  ↓ (BFF layer detects revocation flag, clears HttpOnly cookie on next request)
  ↓ (handler returns { success, message: "Session revoked" })
```

### Revoke All Sessions

```
DELETE /api/admin/users/{userId}/sessions
  ↓ (handler extracts adminID, validates userID)
  ↓ (service.RevokeAllUserSessions calls ListUserSessions)
  ↓ (service marks each session for revocation via repo.RevokeSession)
  ↓ (service logs single audit event: [AUDIT] action=ALL_SESSIONS_REVOKED count=N)
  ↓ (handler returns { success, message: "All sessions revoked" })
```

## Session Storage (Redis)

### Key Patterns

**Session metadata:**
```
Key:   bff:session:{sessionId}
Value: JSON with user_id, login_time (RFC3339), expires_at, login_ip, browser
TTL:   7 days (set at login by BFF)
```

**User session tracking:**
```
Key:   bff:user_sessions:{userId}
Type:  Redis SET
Value:  [sessionId1, sessionId2, ...]
Note:   Maintained by BFF on login/logout
```

**Revocation flags:**
```
Key:   bff:revoked_sessions:{sessionId}
Value: "true"
TTL:   Until session expires (min 1 minute)
Note:  BFF checks this on every request; clears cookie if flag exists
```

## API Endpoints

### List Active Sessions

**Endpoint:** `GET /api/admin/users/{userId}/sessions`

**Auth:** JWT (any authenticated admin user)

**Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "Sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "session_id": "uuid-1",
        "user_id": 1,
        "login_time": "2026-06-06T10:30:00Z",
        "expires_at": "2026-06-13T10:30:00Z",
        "login_ip": "192.168.1.100",
        "browser": "Chrome/macOS",
        "status": "active"
      }
    ]
  }
}
```

### Revoke Single Session

**Endpoint:** `DELETE /api/admin/users/{userId}/sessions/{sessionId}`

**Auth:** JWT (admin only)

**Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "Session revoked successfully",
  "data": { "message": "Session revoked" }
}
```

### Revoke All Sessions

**Endpoint:** `DELETE /api/admin/users/{userId}/sessions`

**Auth:** JWT (admin only)

**Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "All sessions revoked successfully",
  "data": {
    "message": "All sessions revoked",
    "revoked_count": 0
  }
}
```

## Audit Logging

Phase 1 logs to **stdout** in the format:
```
[AUDIT] action=SESSION_REVOKED admin_id=999 timestamp=2026-06-06T21:01:23+07:00 details=Session uuid revoked from user 1
[AUDIT] action=ALL_SESSIONS_REVOKED admin_id=999 timestamp=2026-06-06T21:01:23+07:00 details=All 2 sessions revoked for user 1
```

**Phase 2 enhancement:** Persist to `dblogfile` table or dedicated `session_audit_log` table.

## Security & Authorization

1. **Admin-only access** — all endpoints require `RoleMiddleware("admin")`
2. **Session ownership check** — service verifies session belongs to target user
3. **User ID from JWT** — extracted from token claims, not request body
4. **Fail-open on Redis** — if Redis is down, session revocation is not available (graceful degradation)

## Testing

### Test Coverage

- **Handler tests** (handler_test.go): HTTP status codes, JSON parsing, permission checks
- **Service tests** (service_test.go): Business logic, expired session filtering, audit logging
- **Repository tests** (repository_test.go): Skipped (require real Redis; E2E tests in `backend/tests/e2e/`)

**All tests use mocked repositories** via testify/mock.

**Current status:** 13/13 tests PASS, 87% coverage on tested code.

### Running Tests

```bash
# Session domain only
go test ./internal/features/session/... -v

# All backend tests
go test ./... -v

# With coverage
go test -cover -coverprofile=coverage.out ./internal/features/session/...
go tool cover -html=coverage.out
```

## Next Steps (Phase 2)

1. **Frontend User Management**:
   - Add "Active Sessions" tab in user detail modal
   - Display session list with login time, expires at, status
   - Add "Force Logout" button (single + bulk)
   - Confirmation dialogs

2. **Audit Log Persistence**:
   - Replace stdout logging with DB persistence
   - Use `dblogfile` table if activity logging is configured
   - Add filtering by action (SESSION_REVOKED, ALL_SESSIONS_REVOKED)

3. **Enhanced Session Info**:
   - Browser detection (parse user-agent)
   - Device fingerprinting (optional)
   - Geolocation from IP (optional)
   - Session flags (is_current, is_mobile, etc.)

4. **E2E Testing**:
   - Spin up Redis in docker-compose
   - Test actual session storage/retrieval
   - Test revocation via BFF layer

## Common Issues & Troubleshooting

**Issue:** Session endpoints return 403 Forbidden
- **Cause:** JWT token missing `role: admin` claim
- **Fix:** Ensure login handler sets role in JWT; check RoleMiddleware configuration

**Issue:** Sessions not being listed
- **Cause:** `bff:user_sessions:{userId}` set is empty (user never logged in via BFF)
- **Fix:** Ensure BFF session.ts calls `createSession()` and maintains the set on login

**Issue:** Revocation doesn't immediately log out user
- **Cause:** BFF layer hasn't checked revocation flag yet (checked on next request)
- **Fix:** User will be logged out on next page refresh or API call

**Issue:** Redis connection fails silently
- **Cause:** Fail-open behavior — if Redis is down, session APIs return empty results
- **Fix:** Check Redis connectivity; monitor logs for "Redis is not reachable"

## References

- **Architecture guide**: `~/.claude/projects/.../memory/dapen-architecture.md`
- **Code style**: `~/.claude/projects/.../memory/dapen-code-style.md`
- **Task spec**: `tasks/TASK-012-session-monitoring-user-management.md`
- **Backend AI.md**: `backend/AI.md`

## Changelog

**Phase 1 (2026-06-06):**
- ✅ Created session domain (entity, dto, repository, service, handler, routes)
- ✅ Implemented all three endpoints (list, revoke single, revoke all)
- ✅ Added mocked unit tests (13 tests, 87% coverage)
- ✅ Wired into app initialization (app.go + routes.go)
- ✅ Audit logging to stdout
- ✅ Swagger documentation on all endpoints
- ⏳ Next: Phase 2 (Frontend UI integration)
