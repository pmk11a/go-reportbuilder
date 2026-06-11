<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-019: Dedicated Pages Architecture — User Management

## Business Problem

Current pattern uses **Modals + Row Expand** which creates:
- Cluttered list pages with modals stacked on top
- Row expand state that's not URL-addressable
- Hard to share/bookmark specific items
- Scroll hell on mobile
- Complex state management (open/close/expand)
- Difficult to test per view

**Target pattern:** Modern SPA with **dedicated pages** per view — URL = state, clean separation, full screen.

## Priority: High

## Status
⏳ **IN_PROGRESS** — 2026-06-11 (User Management pilot)

## New Architecture Pattern

```
frontend/src/routes/admin/_layout/master-data/users/
├── index.tsx                          # List page: table + search + filter
├── new/
│   └── index.tsx                     # Create page: form
└── $id/
    ├── index.tsx                     # Detail page: tabs (Overview, Permissions, Sessions, Activity)
    └── edit/
        └── index.tsx                 # Edit page: form
```

### Page Responsibilities

| Page | Path | Responsibility |
|---|---|---|
| **List** | `/admin/master-data/users/` | Table, search, filter, add button, pagination |
| **Create** | `/admin/master-data/users/new` | Form with validation |
| **Detail** | `/admin/master-data/users/:id` | Tabs: Overview, Permissions, Sessions, Activity |
| **Edit** | `/admin/master-data/users/:id/edit` | Form with pre-filled data |

### Detail Page Tabs

```
┌─────────────────────────────────────────────────────────┐
│ ← Back     SUPER ADMIN (SA)     [Edit]  [Delete]        │
├─────────────────────────────────────────────────────────┤
│ [Overview] [Permissions] [Sessions] [Activity]            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Tab content here                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Component Breakdown

```
frontend/src/components/admin/users/
├── pages/
│   ├── UsersListPage.tsx           # List page component
│   ├── UserFormPage.tsx            # Create/Edit form (reusable)
│   └── UserDetailPage.tsx         # Detail page with tabs
├── tabs/
│   ├── UserOverviewTab.tsx         # Basic info, status, stats
│   ├── UserPermissionsTab.tsx      # Permissions management
│   ├── UserSessionsTab.tsx        # Active sessions
│   └── UserActivityTab.tsx         # Activity log for this user
├── table/
│   ├── UsersTable.tsx              # Table component
│   ├── UsersTableToolbar.tsx       # Search + filter
│   ├── UsersTablePagination.tsx     # Pagination
│   └── UsersRow.tsx                # Single row
└── shared/
    ├── UserStatusBadge.tsx
    └── UserInfoCard.tsx
```

## Migration Steps

### Phase 1: Create Route Structure
1. Create `/admin/master-data/users/` directory structure
2. Create `index.tsx` (list page)
3. Create `$id/index.tsx` (detail page)
4. Create `$id/edit/index.tsx` (edit page)
5. Create `new/index.tsx` (create page)

### Phase 2: List Page
1. Move table logic from current `user-management/index.tsx`
2. Keep search, filter, pagination
3. Row click → navigate to `/users/:id`
4. "Add User" → navigate to `/users/new`
5. Keep action buttons (optional, detail page has more)

### Phase 3: Detail Page
1. Create tabs component
2. Implement Overview tab (basic info)
3. Implement Permissions tab (reuse existing)
4. Implement Sessions tab (reuse existing)
5. Implement Activity tab (reuse existing)
6. Add Edit/Delete buttons in header

### Phase 4: Form Page (Create + Edit)
1. Reuse existing `UserFormDialog` logic
2. Create `UserFormPage` component
3. Handle validation
4. Handle success → redirect

### Phase 5: Cleanup
1. Delete old `user-management/` route
2. Delete old modal components (if replaced)
3. Update navigation/sidebar links
4. Run quality gates

## Acceptance Criteria

### List Page
- [ ] Page at `/admin/master-data/users/`
- [ ] Table with users data
- [ ] Search functionality
- [ ] Status filter
- [ ] Pagination
- [ ] Row click navigates to detail page
- [ ] "Add New" button navigates to create page
- [ ] `npm run type-check` exits 0

### Detail Page
- [ ] Page at `/admin/master-data/users/:id`
- [ ] Back button navigates to list
- [ ] 4 tabs: Overview, Permissions, Sessions, Activity
- [ ] Edit button navigates to edit page
- [ ] Delete button with confirmation
- [ ] All tab data loads correctly

### Create Page
- [ ] Page at `/admin/master-data/users/new`
- [ ] Form with all required fields
- [ ] Validation
- [ ] Success → redirect to detail page
- [ ] Cancel → redirect to list

### Edit Page
- [ ] Page at `/admin/master-data/users/:id/edit`
- [ ] Form pre-filled with user data
- [ ] Validation
- [ ] Success → redirect to detail page
- [ ] Cancel → redirect to detail page

### General
- [ ] All existing functionality preserved
- [ ] No breaking changes to other features
- [ ] `./scripts/check-all.sh --frontend-only` exits 0
- [ ] Tests pass

## User Scenarios

### Happy Path
- [ ] ⬜ User opens `/admin/master-data/users/` → sees paginated list
- [ ] ⬜ User clicks row → navigates to `/admin/master-data/users/SA` → sees detail
- [ ] ⬜ User clicks Permissions tab → sees permissions form
- [ ] ⬜ User clicks Sessions tab → sees active sessions
- [ ] ⬜ User clicks Activity tab → sees activity log for that user
- [ ] ⬜ User clicks Edit → navigates to `/admin/master-data/users/SA/edit`
- [ ] ⬜ User clicks "Add New User" → navigates to `/admin/master-data/users/new`

### Edge Cases
- [ ] ⬜ User not found → 404 page
- [ ] ⬜ Form validation fails → show errors inline
- [ ] ⬜ Delete confirmation → "Are you sure?" with cancel option

## Dependencies
- TanStack Start migration complete (TASK-016)
- Existing server functions, services, hooks working
- Existing modal components (for reuse)

## Estimate
**Hours**: 8-12h (medium-large) — 4 pages + 4 tabs + cleanup

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Breaking existing user workflows | Keep old route during transition, redirect after verify |
| Losing existing functionality | Reuse existing components (Sessions, Permissions, Activity) |
| URL change affecting bookmarks | Old URL redirect to new structure |