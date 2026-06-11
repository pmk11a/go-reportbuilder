<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-018: User-Specific Activity Log in User Management

## Business Problem

User Management page needs to show per-user activity log (audit trail) from the existing Activity Log system (`dblogfile` table). When admin clicks "Activity Log" action for a user, a modal should display that user's activities with pagination, search, and date filtering.

## Priority: Medium

## Status
✅ **COMPLETED** — Implementation done 2026-06-10, pending user manual verification

## Acceptance Criteria

### Backend (Go)
- [x] `activity/handler.go` `GetLogs` — add `pemakai` (user filter) and `start_date` / `end_date` (date range) query params
- [x] `activity/service.go` `GetLogs` — accept filter params, pass to repo
- [x] `activity/repository.go` `GetLogs` — add WHERE clause for `pemakai` = userId AND `tanggal` BETWEEN start_date AND end_date
- [x] Build clean: `go build ./cmd/main.go`
- [x] Tests pass: `go test ./internal/features/activity/... -v`

### Frontend (TypeScript)
- [x] New server function `getActivityLogsByUserFn` in `src/server/functions/admin/activity-logs.ts`
- [x] New service `getActivityLogsByUser` in `src/services/activityLogService.ts`
- [x] New hook `useActivityLogsByUser` in `src/hooks/useActivityLog.ts`
- [x] New `UserActivityLogModal.tsx` component with table (bg-primary-600 header), pagination, search, date filter, skeleton, empty state
- [x] "Activity Log" button wired in User Management table (user-management/index.tsx)
- [x] Modal state + component wired
- [x] `npm run type-check` exits 0

## User Scenarios

### Happy Path
- [ ] ⬜ Admin opens User Management → clicks "Activity Log" on a user row → modal shows paginated list of that user's activities
- [ ] ⬜ Admin types in search box → list filters by aktivitas/keterangan
- [ ] ⬜ Admin sets date range → list filters by tanggal between start/end
- [ ] ⬜ Admin clicks Next/Prev page → list updates with correct pagination

### Empty/Edge Cases
- [ ] ⬜ User has no activity logs → shows "No activity logs" empty state
- [ ] ⬜ Start date but no end date → treat end date as today
- [ ] ⬜ Date range with no results → shows empty state

## Implementation Plan

### 1. Backend (@dapen-backend)
**Files to modify:**
- `backend/internal/features/activity/handler.go` — `GetLogs` function: parse `pemakai`, `start_date`, `end_date` query params from Gin context, pass to service
- `backend/internal/features/activity/service.go` — `GetLogs` interface + implementation: accept filter struct `{Pemakai, StartDate, EndDate}`, pass to repo
- `backend/internal/features/activity/repository.go` — `GetLogs`: add WHERE clause with GORM. Add optional `Where(...)` calls for each non-empty filter

**Filter struct (in service/dto):**
```go
type SActivityLogFilter struct {
    Pemakai   string // legacy user_id string (e.g. "SA")
    StartDate string // RFC3339 date "2006-01-02"
    EndDate   string // RFC3339 date "2006-01-02"
}
```

**Repository query:**
```go
query := r.db.Model(&SDBLogFile{})
if filter.Pemakai != "" {
    query = query.Where("pemakai = ?", filter.Pemakai)
}
if filter.StartDate != "" {
    query = query.Where("tanggal >= ?", filter.StartDate)
}
if filter.EndDate != "" {
    query = query.Where("tanggal <= ?", filter.EndDate)
}
query.Count(&count)
query.Order("tanggal desc").Limit(limit).Offset(offset).Find(&logs)
```

### 2. Frontend (@dapen-frontend)
**Files to create:**
- `src/server/functions/admin/activity-logs.ts` — add `getActivityLogsByUserFn`
- `src/services/activityLogService.ts` — add `getActivityLogsByUser(userId, page, limit, query?, startDate?, endDate?)`
- `src/hooks/useActivityLog.ts` — add `useActivityLogsByUser(userId, filters)` hook using TanStack Query
- `src/components/admin/users/UserActivityLogModal.tsx` — modal with table, pagination, search, date filter

**Files to modify:**
- `src/routes/admin/_layout/master-data/user-management/index.tsx` — add "Activity Log" column/action button + modal state + modal component

## Testing Approach
- Manual: Open User Management → Activity Log for SA → verify list, search, date filter, pagination work
- Backend: `go test ./internal/features/activity/...`

## Estimate
**Hours**: 4-6h (medium)

## Dependencies
- Existing activity log system (backend + frontend) — already exists
- `dblogfile` table with `pemakai` field already populated

## Risks & Mitigations
| Risk | Mitigation |
|---|---|
| `pemakai` format mismatch (numeric vs string) | Confirm `pemakai` stores legacy user_id string ("SA") — verified in activity_plugin.go line 148-150 |
| Large date ranges cause slow queries | Default limit=10, require at least start OR end date |
