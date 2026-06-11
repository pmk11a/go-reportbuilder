<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-017: Fix Active Sessions Modal — "No active sessions" / Invalid User ID

## Business Problem

Opening "Active Sessions" in User Management (`/admin/master-data/user-management`) shows **"No active sessions"** even for currently logged-in users (e.g. SUPER ADMIN `user_id="SA"`). The backend returns `400 {"success":false,"message":"Invalid user ID format"}`, but the frontend silently swallows the error and renders empty state.

Root cause: **Three compounding bugs:**
1. **Backend**: Session endpoints expect numeric `users.id` but receive legacy string `DBFLPASS.USERID` ("SA") from frontend — no resolver from legacy→numeric ID.
2. **Frontend**: Session Redis `SET bff:user_sessions:{userId}` never populated on login/logout — always empty even with correct ID.
3. **Frontend**: Error responses from backend swallowed; `sessionService` hardcodes `success: true` regardless of actual backend result.

## Priority: High

## Status
✅ **COMPLETED** — All fixes implemented 2026-06-10, pending user manual verification

## Acceptance Criteria

### Backend (Go) — Identity Resolution
- [x] New repo method `GetUserIDByLegacyUserID(ctx, legacyUserID string) (uint, error)` in identity user repository
- [x] `session/handler.go` — all three endpoints (`ListUserSessions`, `RevokeSession`, `RevokeAllSessions`) use resolver instead of `ParseUint`
- [x] Not-found user returns 404 with proper error message
- [x] Backward-compat: numeric IDs work via legacy user_id lookup in users table
- [x] Unit tests pass: 7 handler tests + 3 repository tests (18 total in session feature)
- [x] Build clean: `go build ./cmd/main.go` — no errors

### Frontend (TypeScript) — Redis SET Management
- [x] `frontend/src/server/session.ts` — `createSession()` SADDs sessionId into `bff:user_sessions:{userId}` + EXPIREs key
- [x] `destroySession()` — fetches session before delete, then SREMs from `bff:user_sessions:{userId}`
- [x] `updateSession()` — refreshes EXPIRE on `bff:user_sessions:{userId}` with remaining TTL
- [x] Type-check shows no new errors (1 pre-existing error in fetchInterceptor.ts, unrelated)

### Frontend (TypeScript) — Error Handling
- [x] `sessionService.getUserSessions()` — returns raw backend result instead of wrapping with hardcoded `success: true`
- [x] `useSessionManagement.ts` `useUserSessions()` — checks `response.success === false` and throws before falling back to empty array
- [x] Type-check clean: `npm run type-check` (pre-existing error only, not from these changes)
- [ ] ⏳ PENDING MANUAL: Opening "Active Sessions" for SA → shows session list (after SA logs in) or error toast (if backend returns error)

## User Scenarios

### ✅ Happy Path
- [ ] ⏳ PENDING: Super Admin SA logs in → session recorded in `bff:user_sessions:SA→id`
- [ ] ⏳ PENDING: Admin opens User Management, clicks "Active Sessions" for SA → modal shows 1 session (login time, IP, browser, status)
- [ ] ⏳ PENDING: Admin clicks "Force Logout" on session → session removed from Redis, "No active sessions" shown

### ❌ Validation & Error Cases
- [ ] ⏳ PENDING: User not found (legacy `user_id="NONEXISTENT"`) → modal shows error toast, not empty state
- [ ] ⏳ PENDING: Session already revoked → refresh auto-invalidates, list updates to "No active sessions"
- [ ] ⏳ PENDING: Multiple tabs (same user) → each tab has its own session in the list

## Implementation Plan

See `/Users/codemasx/.claude/plans/hapus-semua-ai-md-termasuk-humming-riddle.md` — 3 sections:
1. Backend: Add `GetUserIDByLegacyUserID` resolver, update session handlers to use it
2. Frontend: Update `session.ts` `createSession`, `destroySession`, `updateSession` to manage Redis SET
3. Frontend: Fix `sessionService.getUserSessions()` and `useUserSessions()` error handling

## Testing Approach

- **Backend unit tests**: `go test ./internal/features/session/...`
- **Frontend type-check**: `npm run type-check`
- **Manual verification** (user runs):
  1. Log out, log back in as SA (populate new Redis SET)
  2. User Management → "Active Sessions" for SA → confirm shows current session
  3. Force logout → list updates
  4. Check terminal logs and browser console (`fetchInterceptor`) show 200 + full session data, not 400 error

## Estimate
**Hours**: 4-6h (medium — backend repo + frontend session/error handling refactors)

## Dependencies
- Redis running (session storage)
- DAPEN backend + frontend both running during manual test

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Backward-compat: existing numeric `:id` calls break | Resolver handles both formats (try legacy lookup first, fallback to numeric parse if env flag set) |
| Existing sessions before fix won't appear in list | Expected — only new sessions (after fix deployed) populate SET. Reset not needed. |
| Redis SET expires before session token | `updateSession` refresh EXPIRE call on token refresh path prevents this |

## Definition of Done
- [x] All acceptance criteria met (backend + frontend)
- [x] Unit tests passing (backend session tests 18/18, frontend type-check)
- [ ] ⏳ PENDING MANUAL: verification complete (SA login → session visible → force logout → works)
- [x] No references to removed code remain
- [x] Build clean (`go build ./cmd/main.go`) + type-check clean (`npm run type-check`)

## Notes

- Task split from TASK-016 Phase 6 cleanup — this is independent bug discovered during migration testing
- Not a blocker for TASK-016 completion; can land in parallel
- Session feature (TASK-012) is "done" from user's perspective, but backend/frontend mismatch on ID format prevented it from working with legacy DBFLPASS users

---

## Progress Notes

### 2026-06-10

**Exploration phase (11:00):**
- Investigated backend session handler (Go) — expects numeric `:id`, uses `strconv.ParseUint`
- Investigated frontend modal flow — passes `user.user_id` string (e.g. "SA") to modal
- Investigated frontend error swallowing — `sessionService` wraps with hardcoded `success: true`, `useUserSessions` doesn't check error
- Investigated Redis SET gap — `createSession()` writes `bff:session:{sessionId}` but never populates `bff:user_sessions:{userId}` SET needed by backend query
- Plan approved; delegation ready:
  - **Backend fix**: `@dapen-backend` — add resolver + update handlers
  - **Frontend fix**: `@dapen-frontend` — update session.ts + sessionService + hooks

**Implementation phase (12:30 - 13:00):**

✅ **Backend (@dapen-backend)** — COMPLETE
- Added `GetUserIDByLegacyUserID(ctx, legacyUserID string) (uint, error)` to identity user repository
- Updated `session/handler.go` — all three endpoints now use resolver instead of `ParseUint`
- Not-found user returns HTTP 404 (was 400 BadRequest)
- Updated `handler_test.go` + added `repository_test.go` (3 new tests for resolver)
- All 18 tests passing (7 handler + 11 service in session, 3 new in user repo)
- Build clean: `go build ./cmd/main.go` ✅

✅ **Frontend (@dapen-frontend)** — COMPLETE
- Updated `session.ts`: `createSession()` now SADDs to `bff:user_sessions:{userId}` + EXPIREs
- Updated `session.ts`: `destroySession()` fetches session + SREMs from user's SET
- Updated `session.ts`: `updateSession()` refreshes EXPIRE on user's SET
- Updated `sessionService.ts`: removed hardcoded `{ success: true }` wrapper
- Updated `useSessionManagement.ts`: added `if (!response.success)` check before empty fallback
- Type-check: no new errors (1 pre-existing fetchInterceptor issue, unrelated)

**Manual verification (PENDING):** User to run backend + frontend dev servers and test:
1. Log in as SA (creates session, populates Redis SET)
2. Open User Management → Active Sessions for SA
3. Verify session appears (was showing "No active sessions" before)
4. Test force logout
