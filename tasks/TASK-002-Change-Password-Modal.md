# TASK-002: Change Password Modal (Global)

## Description
Create a menu with the `#changePassword` link that can open the change password modal from anywhere, similar to how `#setupPeriode` works. Extract the standalone modal component from `MainHeader`.

## Status
✅ **COMPLETED** - May 31, 2026

## Checklist
- [x] Create `frontend/src/components/modals/ChangePasswordModal.tsx`
- [x] Update `frontend/src/components/providers/ModalProvider.tsx` to register `ChangePasswordModal`
- [x] Remove inline password modal from `frontend/src/components/layouts/MainHeader.tsx`
- [x] Map `#changePassword` link logic (using `MenuListCard` internal routing)
