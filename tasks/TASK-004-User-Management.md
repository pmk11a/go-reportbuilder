# TASK-004: User Management

## Description
Create an interface to add, edit, and delete users (karyawan/admin/superadmin) similar to the reference `/admin/users` at the route `/admin/master-data/user-management`.

## Status
✅ **COMPLETED** - June 1, 2026

## Backend
- [x] Create `backend/internal/handlers/admin/user_handler.go`
- [x] Register routes in `backend/internal/routes/api.go`

## Frontend
- [x] Create `frontend/src/routes/admin/master-data/user-management/index.tsx` (DataTable)
- [x] Create `frontend/src/components/admin/users/UserFormDialog.tsx`
- [x] Create `frontend/src/services/userService.ts`
- [x] Create `frontend/src/hooks/useUsers.ts`
- [x] Create `frontend/src/components/admin/users/UserFormDialog.test.tsx`
- [x] Create `backend/internal/handlers/user_handler_test.go`

## User Scenarios
- [x] 🟩 COMPLETED: **[Positive] List Users**: Admin navigates to `/admin/master-data/user-management`. The page successfully loads a paginated data table showing a list of users, fetching data via `GET /api/users`.
- [x] 🟩 COMPLETED: **[Positive] Create User**: Admin clicks 'Add User', fills out the modal (Username, Full Name, Role), and clicks Save. The UI shows a success toast, modal closes, and the table refreshes. The API successfully stores the user in the database.
- [x] 🟩 COMPLETED: **[Negative] Create User (Duplicate Username)**: Admin tries to create a new user with an already existing `Username`. The API returns a 400 Bad Request error. The UI catches this via `errorMapper.ts` and displays a descriptive error toast to the user.
- [x] 🟩 COMPLETED: **[Positive] Edit User Role**: Admin clicks the 'Edit' action on a specific user row. The modal opens pre-filled. Admin changes the role from 'employee' to 'admin' and clicks Save. The API successfully updates the record.
- [x] 🟩 COMPLETED: **[Edge Case] Delete Self**: Admin attempts to delete their own account from the table. The API should ideally block this (return 403 or 400), and the UI displays an error indicating "You cannot delete your own account".
- [x] 🟩 COMPLETED: **[Positive] Delete User**: Admin clicks 'Delete' on another user's row. A confirmation dialog appears. After confirming, the user is soft-deleted, and the table refreshes.
