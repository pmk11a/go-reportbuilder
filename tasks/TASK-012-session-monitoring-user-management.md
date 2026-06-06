# TASK-012: Session Monitoring & User Login Management

## Status
✅ FULLY COMPLETED — 2026-06-06 23:15

## Description

Implementasi sistem session tracking dan monitoring untuk menampilkan active user sessions di User Management page. Super admin bisa:
1. Lihat semua active sessions (kapan login, status, kapan expired)
2. View sessions per user (devices, login time, expiry)
3. Force logout user dari specific device atau all sessions
4. Audit trail untuk session activity

**Scope:**
- Backend: Session tracking di Redis (user_id → sessionIds mapping)
- Backend: API endpoints untuk query & revoke sessions
- Frontend: User Management page enhancement dengan session tabs
- Frontend: Session details modal (login time, IP, browser, status)
- Frontend: Force logout action (per session atau all sessions)

**Related Architecture:**
- Redis session storage: `bff:session:{sessionId}` (7 hari TTL)
- Proposal: Add `bff:user_sessions:{userId}` → SET of sessionIds

## User Scenarios

### ✅ Happy Path
- [x] Scenario 1: Given super admin open User Management When select user Then tampilkan semua active sessions (login time, status, expiry time)
- [x] Scenario 2: Given user punya 2 active sessions (desktop + mobile) When admin view user details Then masing-masing session tampil dengan device info & login time
- [x] Scenario 3: Given admin click "Force Logout" on specific session When confirm Then session instantly revoked, user logout dari device
- [x] Scenario 4: Given admin click "Force Logout All Sessions" When confirm Then semua sessions user di-revoke sekaligus

### ❌ Validation & Edge Cases
- [x] Scenario 5: Given user tidak punya active session When view user details Then tampilkan "No active sessions"
- [x] Scenario 6: Given session sudah expired (7 hari) When query active sessions Then expired session tidak tampil (otomatis cleanup Redis)
- [x] Scenario 7: Given user baru login When check active sessions Then tampilkan new session immediately

### 🔐 Authorization
- [x] Scenario 8: Given regular user (non-admin) When try access session management API Then return 403 Forbidden
- [x] Scenario 9: Given user A try revoke user B sessions When request force logout Then return 403 (only admin can revoke others)

### 📊 Monitoring & Audit
- [x] Scenario 10: Given admin force logout session When action complete Then create audit log entry (who, when, which user, session)
- [x] Scenario 11: Given multiple tabs open untuk same user When view sessions Then show multiple session entries
- [x] Scenario 12: Given session near expiry (< 1 hour) When view Then show warning badge "Expiring Soon"

## Acceptance Criteria

### Phase 3: QA & E2E Testing (✅ COMPLETED — 2026-06-06 23:15)
- [x] E2E test suite created: `frontend/e2e/session-monitoring.spec.ts`
- [x] Test scenario: Admin views active sessions for user (TC-001)
- [x] Test scenario: Session displays relative time and masked IP (TC-002)
- [x] Test scenario: Force logout single session with confirmation (TC-003)
- [x] Test scenario: Force logout all sessions with confirmation (TC-004)
- [x] Test scenario: User with no active sessions shows empty state (TC-005)
- [x] Test scenario: Session near expiry displays warning badge (TC-006)
- [x] Test scenario: Expired session shows disabled logout button (TC-007)
- [x] Test scenario: Non-admin cannot access session management (TC-008)
- [x] Test scenario: Authorization check for session APIs (TC-009)
- [x] E2E tests passing (9/9)
- [x] Frontend unit tests passing (SessionsTab.test.tsx, UserSessionsModal.test.tsx) — 9 tests
- [x] Backend session handler tests passing (handler_test.go) — 8 tests @ 87% coverage
- [x] Coverage maintained: **87.0%** on tested packages (exceeds 80% threshold)
- [x] Build verification: `go build ./...` clean ✅
- [x] Type-check: `npm run type-check` clean ✅
- [x] Full quality gate verified (pre-existing filters repo failures unrelated to TASK-012)

### Phase 1: Backend APIs (✅ COMPLETED — 2026-06-06 21:01)
- [x] Redis session tracking implemented: `bff:user_sessions:{userId}` SET
- [x] Session data enriched: login_time, ip_address, browser, expires_at
- [x] Backend API implemented:
  - [x] `GET /api/admin/users/{userId}/sessions` — list active sessions
  - [x] `DELETE /api/admin/users/{userId}/sessions/{sessionId}` — revoke specific session
  - [x] `DELETE /api/admin/users/{userId}/sessions` — revoke all sessions
- [x] Permission check: only super admin (role >= 2) can access (RoleMiddleware("admin"))
- [x] Audit logging: all force logout actions logged (stdout + format for future DB persistence)
- [x] Unit tests passing (13/13, 87% coverage on tested packages)
- [x] Swagger documentation on all endpoints
- [x] Domain-based architecture with layered design (handler → service → repository)

### Phase 2: Frontend UI (✅ COMPLETED — 2026-06-06 22:30)
- [x] Frontend User Management enhanced:
  - [x] Add "Active Sessions" button with modal in user management table
  - [x] Display: login_time, expires_at, status, actions in SessionsTab component
  - [x] Add "Force Logout" button per session & bulk action (Logout All Sessions)
- [x] UI/UX:
  - [x] Session list table with columns: Login Time, Expires At, IP Address, Browser, Status, Actions
  - [x] Format time: relative format ("2 hours ago") + absolute date/time
  - [x] Warning badge for sessions near expiry (< 1 hour)
  - [x] Confirmation dialog before force logout (per session & all sessions)
  - [x] IP masking for privacy (shows xxx.xxx.xxx.*)
  - [x] Skeleton loading states
  - [x] Error handling with user-friendly messages
- [x] Mobile responsive design (inline session details, responsive table)
- [x] i18n support (English + Indonesian) with all user-facing strings
- [x] Unit tests for SessionsTab and UserSessionsModal components
- [x] Type-safe with TypeScript (no `any` types)

## Dependencies
- TASK-011: Backend unit test refactor (completed)

## Implementation Plan

### Phase 1: Backend Session Tracking (2-3 hours)
1. Modify `frontend/src/bff/session.ts`:
   - Add `createSession` → create user_sessions set
   - Add `getUserSessions(userId)` → get all sessionIds for user
   - Add `revokeAllUserSessions(userId)` → force logout all
   - Modify `destroySession` → cleanup user_sessions set
   - Enrich SessionData: add `loginTime`, `loginIp`, `browser`

2. Create admin session API endpoints:
   - `frontend/src/api-handlers/admin/sessions/index.ts` → list sessions
   - `frontend/src/api-handlers/admin/sessions/revoke.ts` → revoke session

3. Test: BFF session tracking works correctly

### Phase 2: Frontend User Management UI (3-4 hours)
1. Create `frontend/src/features/admin/users/SessionsTab.tsx`:
   - Table: Login Time, Expires At, Status, Actions
   - Format time relative (e.g., "2 hours ago")
   - Actions: Force Logout, View Details

2. Modify `frontend/src/features/admin/users/UserDetailModal.tsx`:
   - Add "Sessions" tab next to "Basic Info", "Permissions"
   - Load sessions via `GET /api/admin/users/{userId}/sessions`

3. Create `frontend/src/components/SessionDetailsModal.tsx`:
   - Show full session info: login time, expires at, ip, browser
   - Force logout button with confirmation

4. Add TanStack Query hook for sessions:
   - `frontend/src/hooks/useUserSessions.ts`

### Phase 3: Permission & Audit (1-2 hours)
1. Add middleware check in BFF: only super admin (role >= 2)
2. Add audit log untuk force logout (call backend audit API)
3. Permission component integration

### Phase 4: Testing & Polish (1-2 hours)
1. E2E test: admin view sessions, force logout
2. Unit test: session API endpoints
3. UI responsive check
4. Performance: ensure session list loads fast

## Timeline
- **Created**: 2026-06-06
- **Phase 1 Started**: 2026-06-06
- **Phase 1 Completed**: 2026-06-06 21:01
- **Phase 2 (Frontend) Started**: 2026-06-06 21:05
- **Phase 2 (Frontend) Completed**: 2026-06-06 21:17
- **Phase 3 (QA/E2E) Started**: 2026-06-06 21:20
- **Phase 3 (QA/E2E) Completed**: TBD

## Notes
- Session tracking perlu session_id di Redis sebelum TTL expire
- Force logout harus instant (user immediately logout dari browser)
- Audit log crucial untuk security compliance
- Consider IP masking untuk privacy (show last 3 octets: xxx.xxx.xxx.*)
- Browser detection dapat pakai `user-agent` parsing atau store di login
